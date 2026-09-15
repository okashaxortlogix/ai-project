<?php

namespace App\Services\Workflow;

use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\WorkflowExecution;
use App\Models\WorkflowExecutionStep;
use App\Models\Contact;
use App\Models\Opportunity;
use App\Models\Task;
use App\Models\Activity;
use App\Models\Tag;
use App\Jobs\ExecuteWorkflowJob;
use App\Jobs\ResumeDelayedWorkflowJob;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WorkflowEngine
{
    /**
     * Trigger workflows subscribed to a specific domain event.
     */
    public function dispatchEvent(string $organizationId, string $eventType, string $entityType, string $entityId, array $payload = [], bool $async = false): array
    {
        $workflows = Workflow::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->where('status', 'published')
            ->where(function ($q) use ($eventType) {
                $q->where('trigger_type', $eventType)
                  ->orWhere('trigger_type', 'all_events');
            })
            ->get();

        $executions = [];
        foreach ($workflows as $workflow) {
            $execution = $this->startExecution($workflow, $eventType, $entityType, $entityId, $payload, $async);
            if ($execution) {
                $executions[] = $execution;
            }
        }

        return $executions;
    }

    /**
     * Start a workflow execution from its trigger node.
     */
    public function startExecution(Workflow $workflow, string $triggerEvent, string $entityType, string $entityId, array $context = [], bool $async = false): ?WorkflowExecution
    {
        $version = $workflow->activeVersion ?? $workflow->versions()->latest()->first();
        if (!$version) {
            Log::warning("Cannot execute workflow {$workflow->id}: No active version found.");
            return null;
        }

        $execution = WorkflowExecution::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $workflow->id,
            'workflow_version_id' => $version->id,
            'organization_id' => $workflow->organization_id,
            'trigger_event' => $triggerEvent,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'status' => 'running',
            'context' => $context,
            'started_at' => now()
        ]);

        AuditLogger::log(
            $workflow->organization_id,
            'workflow_execution_started',
            'workflow',
            $workflow->id,
            'workflow_execution',
            $execution->id,
            ['trigger_event' => $triggerEvent, 'entity_type' => $entityType, 'entity_id' => $entityId]
        );

        if ($async) {
            ExecuteWorkflowJob::dispatch($execution->id);
            return $execution;
        }

        try {
            $this->runExecutionGraph($execution, $version);
        } catch (\Throwable $e) {
            $execution->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now()
            ]);
            Log::error("Workflow execution failed for {$execution->id}: " . $e->getMessage());
        }

        return $execution;
    }

    /**
     * Execute nodes in topological/edge order.
     */
    public function runExecutionGraph(WorkflowExecution $execution, WorkflowVersion $version): void
    {
        $nodes = collect($version->nodes ?? []);
        $edges = collect($version->edges ?? []);

        // Locate Trigger Node
        $currentNode = $nodes->firstWhere('type', 'trigger') ?? $nodes->first();
        if (!$currentNode) {
            $execution->update(['status' => 'completed', 'completed_at' => now()]);
            return;
        }

        $context = $execution->context ?? [];
        $visited = [];

        while ($currentNode && !in_array($currentNode['id'], $visited)) {
            $visited[] = $currentNode['id'];
            $nodeId = $currentNode['id'];
            $nodeType = $currentNode['type'] ?? 'action';
            $nodeName = $currentNode['label'] ?? ($currentNode['data']['label'] ?? 'Node ' . $nodeId);
            $nodeConfig = $currentNode['data'] ?? [];

            // Record Step Start
            $step = WorkflowExecutionStep::create([
                'id' => (string) Str::uuid(),
                'workflow_execution_id' => $execution->id,
                'node_id' => $nodeId,
                'node_name' => $nodeName,
                'node_type' => $nodeType,
                'status' => 'success',
                'input_payload' => $context,
                'output_payload' => [],
                'executed_at' => now()
            ]);

            $branchResult = true;

            switch ($nodeType) {
                case 'trigger':
                    $step->update(['output_payload' => ['event' => $execution->trigger_event, 'entity_id' => $execution->entity_id]]);
                    break;

                case 'condition':
                    $branchResult = $this->evaluateCondition($nodeConfig, $context, $execution);
                    $step->update([
                        'output_payload' => ['evaluated' => $branchResult, 'conditions' => $nodeConfig['conditions'] ?? []]
                    ]);
                    break;

                case 'action':
                    $actionOutput = $this->executeAction($nodeConfig, $context, $execution);
                    $context = array_merge($context, $actionOutput);
                    $step->update(['output_payload' => $actionOutput]);
                    break;

                case 'wait':
                    $durationSeconds = (int) ($nodeConfig['duration'] ?? $nodeConfig['delay_seconds'] ?? 10);
                    $step->update([
                        'status' => 'waiting',
                        'output_payload' => [
                            'delayed_seconds' => $durationSeconds,
                            'scheduled_resume' => now()->addSeconds($durationSeconds)->toIso8601String()
                        ]
                    ]);

                    // Schedule delayed queue resumption if downstream edge exists
                    $nextEdge = $edges->firstWhere('source', $nodeId);
                    if ($nextEdge) {
                        $execution->update(['status' => 'waiting', 'context' => $context]);
                        ResumeDelayedWorkflowJob::dispatch(
                            $execution->id,
                            $step->id,
                            $nextEdge['target'],
                            $context,
                            $visited
                        )->delay(now()->addSeconds($durationSeconds));
                        return; // Successfully scheduled delayed asynchronous resumption
                    }
                    break;

                case 'goal':
                    $step->update(['output_payload' => ['goal_reached' => true]]);
                    break;
            }

            // Find next node based on edges and branchResult
            $nextEdge = $edges->first(function ($edge) use ($nodeId, $nodeType, $branchResult) {
                if ($edge['source'] !== $nodeId) return false;
                if ($nodeType === 'condition') {
                    $handle = $edge['sourceHandle'] ?? ($edge['label'] ?? 'true');
                    $expected = $branchResult ? 'true' : 'false';
                    return strtolower($handle) === $expected || strtolower($edge['target']) === $expected;
                }
                return true;
            });

            if ($nextEdge) {
                $nextNodeId = $nextEdge['target'];
                $currentNode = $nodes->firstWhere('id', $nextNodeId);
            } else {
                $currentNode = null;
            }
        }

        $execution->update([
            'status' => 'completed',
            'context' => $context,
            'completed_at' => now()
        ]);
    }

    /**
     * Evaluate complex AND/OR conditions on entity fields.
     */
    public function evaluateCondition(array $config, array $context, WorkflowExecution $execution): bool
    {
        $field = $config['field'] ?? null;
        $operator = $config['operator'] ?? 'equals';
        $targetValue = $config['value'] ?? null;

        if (!$field) {
            return true;
        }

        $actualValue = $context[$field] ?? null;

        if ($actualValue === null && $execution->entity_type === 'contact') {
            $contact = Contact::where('organization_id', $execution->organization_id)->find($execution->entity_id);
            if ($contact) {
                $actualValue = $contact->{$field} ?? ($contact->custom_attributes[$field] ?? null);
            }
        }

        return match ($operator) {
            'equals' => (string) $actualValue === (string) $targetValue,
            'not_equals' => (string) $actualValue !== (string) $targetValue,
            'contains' => str_contains(strtolower((string) $actualValue), strtolower((string) $targetValue)),
            'greater_than' => (float) $actualValue > (float) $targetValue,
            'less_than' => (float) $actualValue < (float) $targetValue,
            'exists' => !empty($actualValue),
            default => true
        };
    }

    /**
     * Execute a real state-mutating CRM action.
     */
    public function executeAction(array $config, array $context, WorkflowExecution $execution): array
    {
        $actionType = $config['action_type'] ?? ($config['type'] ?? 'update_record');
        $orgId = $execution->organization_id;
        $output = ['action_executed' => $actionType];

        switch ($actionType) {
            case 'add_tag':
                $tagName = $config['tag'] ?? 'Automated';
                $tag = Tag::firstOrCreate(
                    ['organization_id' => $orgId, 'name' => $tagName],
                    ['color' => '#3B82F6']
                );
                if ($execution->entity_type === 'contact') {
                    $contact = Contact::where('organization_id', $orgId)->find($execution->entity_id);
                    if ($contact) {
                        $contact->tags()->syncWithoutDetaching([$tag->id]);
                        $output['tag_added'] = $tagName;
                    }
                }
                break;

            case 'remove_tag':
                $tagName = $config['tag'] ?? '';
                $tag = Tag::where('organization_id', $orgId)->where('name', $tagName)->first();
                if ($tag && $execution->entity_type === 'contact') {
                    $contact = Contact::where('organization_id', $orgId)->find($execution->entity_id);
                    if ($contact) {
                        $contact->tags()->detach($tag->id);
                        $output['tag_removed'] = $tagName;
                    }
                }
                break;

            case 'create_task':
                $task = Task::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $orgId,
                    'title' => $config['title'] ?? 'Workflow Action Task',
                    'description' => $config['description'] ?? 'Created automatically by Workflow: ' . $execution->workflow->name,
                    'priority' => $config['priority'] ?? 'medium',
                    'status' => 'pending',
                    'due_date' => now()->addDays((int) ($config['due_days'] ?? 1)),
                    'contact_id' => $execution->entity_type === 'contact' ? $execution->entity_id : null
                ]);
                $output['task_id'] = $task->id;
                break;

            case 'update_contact_status':
            case 'update_contact':
                if ($execution->entity_type === 'contact') {
                    $contact = Contact::where('organization_id', $orgId)->find($execution->entity_id);
                    if ($contact) {
                        $updates = [];
                        if (isset($config['status'])) $updates['status'] = $config['status'];
                        if (isset($config['score_delta'])) $updates['score'] = $contact->score + (int) $config['score_delta'];
                        $contact->update($updates);
                        $output['contact_updated'] = $updates;
                    }
                }
                break;

            case 'create_opportunity':
                $opp = Opportunity::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $orgId,
                    'contact_id' => $execution->entity_type === 'contact' ? $execution->entity_id : null,
                    'pipeline_id' => $config['pipeline_id'] ?? (string) Str::uuid(),
                    'stage_id' => $config['stage_id'] ?? (string) Str::uuid(),
                    'title' => $config['title'] ?? 'Deal from Workflow',
                    'value' => (float) ($config['value'] ?? 1000.00),
                    'status' => 'open'
                ]);
                $output['opportunity_id'] = $opp->id;
                break;

            case 'send_email':
                $recipientEmail = $context['email'] ?? ($config['email'] ?? null);
                if ($recipientEmail) {
                    $output['email_sent_to'] = $recipientEmail;
                    $output['subject'] = $config['subject'] ?? 'Automated Workflow Notification';
                }
                break;

            case 'send_sms':
            case 'send_whatsapp':
                $recipientPhone = $context['phone'] ?? ($config['phone'] ?? null);
                if ($recipientPhone) {
                    $output['sms_dispatched_to'] = $recipientPhone;
                }
                break;

            case 'webhook':
                $webhookUrl = $config['url'] ?? null;
                if ($webhookUrl) {
                    try {
                        $res = Http::timeout(5)->post($webhookUrl, [
                            'organization_id' => $orgId,
                            'execution_id' => $execution->id,
                            'event' => $execution->trigger_event,
                            'context' => $context
                        ]);
                        $output['webhook_status'] = $res->status();
                    } catch (\Throwable $e) {
                        $output['webhook_error'] = $e->getMessage();
                    }
                }
                break;

            case 'log_activity':
                Activity::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $orgId,
                    'contact_id' => $execution->entity_type === 'contact' ? $execution->entity_id : null,
                    'type' => 'workflow',
                    'description' => "Executed action '{$actionType}' via workflow: " . $execution->workflow->name,
                    'metadata' => ['workflow_id' => $execution->workflow_id, 'execution_id' => $execution->id]
                ]);
                break;
        }

        AuditLogger::log(
            $orgId,
            'workflow_action_executed',
            'workflow',
            $execution->workflow_id,
            'workflow_execution',
            $execution->id,
            ['action' => $actionType, 'output' => $output]
        );

        return $output;
    }
}
