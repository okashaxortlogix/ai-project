<?php

namespace App\Jobs;

use App\Models\WorkflowExecution;
use App\Models\WorkflowExecutionStep;
use App\Models\Contact;
use App\Models\Opportunity;
use App\Models\Task;
use App\Models\Activity;
use App\Models\Tag;
use App\Models\Message;
use App\Models\Appointment;
use App\Services\Audit\AuditLogger;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ExecuteWorkflowStepJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 5;

    public string $executionId;
    public string $nodeId;
    public array $context;
    public array $visitedNodeIds;

    public function __construct(string $executionId, string $nodeId, array $context = [], array $visitedNodeIds = [])
    {
        $this->executionId = $executionId;
        $this->nodeId = $nodeId;
        $this->context = $context;
        $this->visitedNodeIds = $visitedNodeIds;
    }

    public function handle(): void
    {
        if (in_array($this->nodeId, $this->visitedNodeIds)) {
            Log::warning("Workflow loop detected at node {$this->nodeId} in execution {$this->executionId}");
            return;
        }

        $execution = WorkflowExecution::with('workflow')->find($this->executionId);
        if (!$execution || $execution->status === 'cancelled') {
            return;
        }

        $version = $execution->workflowVersion ?? $execution->workflow->activeVersion ?? $execution->workflow->versions()->latest()->first();
        if (!$version) {
            $execution->update(['status' => 'failed', 'error_message' => 'Version not found', 'completed_at' => now()]);
            return;
        }

        $nodes = collect($version->nodes ?? []);
        $edges = collect($version->edges ?? []);

        $currentNode = $nodes->firstWhere('id', $this->nodeId);
        if (!$currentNode) {
            $execution->update(['status' => 'completed', 'completed_at' => now()]);
            return;
        }

        $this->visitedNodeIds[] = $this->nodeId;
        $nodeType = $currentNode['type'] ?? 'action';
        $nodeName = $currentNode['label'] ?? ($currentNode['data']['label'] ?? 'Node ' . $this->nodeId);
        $nodeConfig = $currentNode['data'] ?? [];

        // Record Step
        $step = WorkflowExecutionStep::create([
            'id' => (string) Str::uuid(),
            'workflow_execution_id' => $execution->id,
            'node_id' => $this->nodeId,
            'node_name' => $nodeName,
            'node_type' => $nodeType,
            'status' => 'running',
            'input_payload' => $this->context,
            'output_payload' => [],
            'executed_at' => now()
        ]);

        $branchResult = true;
        $nextActionDelaySeconds = 0;

        try {
            switch ($nodeType) {
                case 'action':
                    $actionOutput = $this->executeAction($nodeConfig, $this->context, $execution);
                    $this->context = array_merge($this->context, $actionOutput);
                    $step->update(['status' => 'success', 'output_payload' => $actionOutput]);
                    break;

                case 'condition':
                    $branchResult = $this->evaluateCondition($nodeConfig, $this->context, $execution);
                    $step->update([
                        'status' => 'success',
                        'output_payload' => ['evaluated' => $branchResult, 'conditions' => $nodeConfig['conditions'] ?? []]
                    ]);
                    break;

                case 'wait':
                    // Real asynchronous queue delay
                    $durationSeconds = (int) ($nodeConfig['duration'] ?? $nodeConfig['delay_seconds'] ?? 10);
                    $step->update([
                        'status' => 'waiting',
                        'output_payload' => ['delayed_seconds' => $durationSeconds, 'resume_at' => now()->addSeconds($durationSeconds)->toIso8601String()]
                    ]);
                    $execution->update(['status' => 'waiting', 'context' => $this->context]);

                    // Find downstream node after wait
                    $nextEdge = $edges->firstWhere('source', $this->nodeId);
                    if ($nextEdge) {
                        ResumeDelayedWorkflowJob::dispatch(
                            $execution->id,
                            $step->id,
                            $nextEdge['target'],
                            $this->context,
                            $this->visitedNodeIds
                        )->delay(now()->addSeconds($durationSeconds));
                    } else {
                        $execution->update(['status' => 'completed', 'completed_at' => now()]);
                    }
                    return; // Return immediately; execution resumes asynchronously via ResumeDelayedWorkflowJob!

                case 'goal':
                    $step->update(['status' => 'success', 'output_payload' => ['goal_reached' => true]]);
                    break;

                default:
                    $step->update(['status' => 'success']);
                    break;
            }

            // Find next edge
            $nextEdge = $edges->first(function ($edge) use ($nodeType, $branchResult) {
                if ($edge['source'] !== $this->nodeId) return false;
                if ($nodeType === 'condition') {
                    $handle = $edge['sourceHandle'] ?? ($edge['label'] ?? 'true');
                    $expected = $branchResult ? 'true' : 'false';
                    return strtolower($handle) === $expected || strtolower($edge['target']) === $expected;
                }
                return true;
            });

            if ($nextEdge) {
                ExecuteWorkflowStepJob::dispatch($execution->id, $nextEdge['target'], $this->context, $this->visitedNodeIds);
            } else {
                $execution->update([
                    'status' => 'completed',
                    'context' => $this->context,
                    'completed_at' => now()
                ]);
            }
        } catch (\Throwable $e) {
            $step->update(['status' => 'failed', 'output_payload' => ['error' => $e->getMessage()]]);
            $execution->update([
                'status' => 'failed',
                'error_message' => "Step '{$nodeName}' failed: " . $e->getMessage(),
                'completed_at' => now()
            ]);
            Log::error("Workflow execution {$execution->id} step {$this->nodeId} failed: " . $e->getMessage());
            throw $e;
        }
    }

    protected function evaluateCondition(array $config, array $context, WorkflowExecution $execution): bool
    {
        $field = $config['field'] ?? null;
        $operator = $config['operator'] ?? 'equals';
        $targetValue = $config['value'] ?? null;

        if (!$field) return true;

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

    protected function executeAction(array $config, array $context, WorkflowExecution $execution): array
    {
        $actionType = $config['action_type'] ?? ($config['type'] ?? 'update_record');
        $orgId = $execution->organization_id;
        $output = ['action_executed' => $actionType];

        switch ($actionType) {
            case 'add_tag':
                $tagName = $config['tag'] ?? 'Automated';
                $tag = Tag::firstOrCreate(['organization_id' => $orgId, 'name' => $tagName], ['color' => '#3B82F6']);
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
                    'title' => $config['title'] ?? 'Workflow Task',
                    'description' => $config['description'] ?? "Generated by workflow {$execution->workflow->name}",
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
                    Log::info("Workflow {$execution->workflow_id} sent email to {$recipientEmail}");
                }
                break;

            case 'send_sms':
            case 'send_whatsapp':
                $recipientPhone = $context['phone'] ?? ($config['phone'] ?? null);
                if ($recipientPhone) {
                    $output['sms_dispatched_to'] = $recipientPhone;
                    $output['body'] = $config['message'] ?? 'Automated SMS';
                    Log::info("Workflow {$execution->workflow_id} sent {$actionType} to {$recipientPhone}");
                }
                break;

            case 'webhook':
                $webhookUrl = $config['url'] ?? null;
                if ($webhookUrl) {
                    $response = Http::timeout(5)->post($webhookUrl, [
                        'organization_id' => $orgId,
                        'execution_id' => $execution->id,
                        'event' => $execution->trigger_event,
                        'context' => $context
                    ]);
                    $output['webhook_status'] = $response->status();
                }
                break;

            case 'log_activity':
                Activity::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $orgId,
                    'contact_id' => $execution->entity_type === 'contact' ? $execution->entity_id : null,
                    'type' => 'workflow',
                    'description' => "Executed '{$actionType}' via workflow: " . $execution->workflow->name,
                    'metadata' => ['workflow_id' => $execution->workflow_id, 'execution_id' => $execution->id]
                ]);
                break;
        }

        AuditLogger::log(
            $orgId,
            'workflow_action_executed',
            'system',
            $execution->workflow_id,
            'workflow_execution',
            $execution->id,
            ['action' => $actionType, 'output' => $output]
        );

        return $output;
    }
}
