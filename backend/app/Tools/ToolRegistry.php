<?php

namespace App\Tools;

use App\Models\Organization;
use App\Models\Conversation;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Opportunity;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\Task;
use App\Models\Tag;
use App\Models\Appointment;
use App\Models\Workflow;
use App\Models\ToolExecution;
use App\Services\Workflow\WorkflowEngine;
use App\Services\Audit\AuditLogger;
use App\Services\Agents\AgentRouter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ToolRegistry
{
    /**
     * Complete GHL CRM Operator Tool Allowlist
     */
    protected array $agentToolAllowlist = [
        'support' => [
            'search_knowledge',
            'search_contacts',
            'get_contact',
            'get_order_status',
            'track_order',
            'get_calendar_availability',
            'create_appointment',
            'create_task',
            'deduplicate_contacts',
            'summarize_conversation',
            'handoff_to_human',
        ],
        'sales' => [
            'search_knowledge',
            'search_contacts',
            'get_contact',
            'create_contact',
            'update_contact',
            'add_tag',
            'search_leads',
            'get_company_leads',
            'search_opportunities',
            'create_opportunity',
            'move_stage',
            'close_opportunity',
            'pipeline_report',
            'create_task',
            'deduplicate_contacts',
            'summarize_conversation',
            'handoff_to_human',
        ],
        'appointment' => [
            'search_knowledge',
            'search_contacts',
            'get_calendar_availability',
            'create_appointment',
            'search_appointments',
            'reschedule_appointment',
            'cancel_appointment',
            'handoff_to_human',
        ],
        'crm' => [
            'search_contacts', 'get_contact', 'create_contact', 'update_contact', 'delete_contact', 'merge_contacts', 'add_tag', 'remove_tag', 'deduplicate_contacts',
            'search_companies', 'get_company', 'create_company', 'update_company',
            'search_leads', 'get_company_leads',
            'search_opportunities', 'create_opportunity', 'update_opportunity', 'move_stage', 'close_opportunity',
            'create_task', 'update_task', 'complete_task', 'assign_task',
            'get_calendar_availability', 'create_appointment', 'search_appointments', 'reschedule_appointment', 'cancel_appointment',
            'search_conversations', 'reply_conversation', 'summarize_conversation', 'handoff_to_human',
            'list_workflows', 'execute_workflow', 'inspect_execution',
            'pipeline_report', 'leads_report', 'agent_report', 'search_knowledge',
            'get_order_status', 'track_order'
        ],
        'assistant' => [ // Master CRM Operator
            'search_contacts', 'get_contact', 'create_contact', 'update_contact', 'delete_contact', 'merge_contacts', 'add_tag', 'remove_tag', 'deduplicate_contacts',
            'search_companies', 'get_company', 'create_company', 'update_company',
            'search_leads', 'get_company_leads',
            'search_opportunities', 'create_opportunity', 'update_opportunity', 'move_stage', 'close_opportunity',
            'create_task', 'update_task', 'complete_task', 'assign_task',
            'get_calendar_availability', 'create_appointment', 'search_appointments', 'reschedule_appointment', 'cancel_appointment',
            'search_conversations', 'reply_conversation', 'summarize_conversation', 'handoff_to_human',
            'list_workflows', 'execute_workflow', 'inspect_execution',
            'pipeline_report', 'leads_report', 'agent_report', 'search_knowledge',
            'get_order_status', 'track_order'
        ]
    ];

    /**
     * Validate and safely execute a server-controlled tool with tenant scoping.
     */
    public function execute(
        string $agentType,
        string $toolName,
        array $input,
        ?Conversation $conversation = null,
        ?string $organizationId = null
    ): array {
        $startTime = microtime(true);
        $orgId = $organizationId ?? ($conversation->organization_id ?? null);

        if (!$orgId) {
            return ['success' => false, 'error' => 'Missing organization tenant context for tool execution.'];
        }

        $allowed = $this->agentToolAllowlist[$agentType] ?? $this->agentToolAllowlist['assistant'];

        if (!in_array($toolName, $allowed)) {
            Log::warning("Agent '{$agentType}' attempted unauthorized tool execution: '{$toolName}'");
            return [
                'success' => false,
                'error' => "Unauthorized tool: {$toolName} for agent {$agentType}"
            ];
        }

        $result = match ($toolName) {
            // Contacts
            'search_contacts' => $this->searchContacts($orgId, $input),
            'get_contact' => $this->getContact($orgId, $input),
            'create_contact' => $this->createContact($orgId, $input),
            'update_contact' => $this->updateContact($orgId, $input),
            'delete_contact' => $this->deleteContact($orgId, $input),
            'add_tag' => $this->addTag($orgId, $input),
            'remove_tag' => $this->removeTag($orgId, $input),
            'deduplicate_contacts' => $this->deduplicateContacts($orgId, $input, $conversation),
            // Companies & Leads
            'search_companies' => $this->searchCompanies($orgId, $input),
            'get_company' => $this->getCompany($orgId, $input),
            'create_company' => $this->createCompany($orgId, $input),
            'search_leads', 'get_company_leads' => $this->searchLeads($orgId, $input),
            // Opportunities
            'search_opportunities' => $this->searchOpportunities($orgId, $input),
            'create_opportunity' => $this->createOpportunity($orgId, $input),
            'move_stage' => $this->moveStage($orgId, $input),
            'close_opportunity' => $this->closeOpportunity($orgId, $input),
            // Tasks
            'create_task' => $this->createTask($orgId, $input),
            'complete_task' => $this->completeTask($orgId, $input),
            // Appointments
            'get_calendar_availability' => $this->getCalendarAvailability($orgId, $input),
            'create_appointment' => $this->createAppointment($orgId, $input),
            'search_appointments' => $this->searchAppointments($orgId, $input),
            'reschedule_appointment' => $this->rescheduleAppointment($orgId, $input),
            'cancel_appointment' => $this->cancelAppointment($orgId, $input),
            // Conversations
            'summarize_conversation' => $this->summarizeConversation($orgId, $input, $conversation),
            // Workflows
            'list_workflows' => $this->listWorkflows($orgId),
            'execute_workflow' => $this->executeWorkflow($orgId, $input),
            // Reports & Analytics
            'pipeline_report' => $this->pipelineReport($orgId),
            'leads_report' => $this->leadsReport($orgId),
            'handoff_to_human' => $this->handoffToHuman($conversation),
            // Knowledge & RAG
            'search_knowledge' => $this->searchKnowledge($orgId, $input),
            // Orders & Ecommerce
            'get_order_status', 'track_order' => $this->getOrderStatus($orgId, $input),
            default => [
                'success' => true,
                'data' => ['message' => 'Tool executed', 'input' => $input]
            ]
        };

        $latency = (int) ((microtime(true) - $startTime) * 1000);

        // Record persistent audit log of tool execution
        $validOrg = Organization::where('id', $orgId)->first();
        if ($validOrg) {
            ToolExecution::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $validOrg->id,
                'conversation_id' => $conversation->id ?? null,
                'tool_name' => $toolName,
                'input_json' => json_encode($input),
                'output_json' => json_encode($result),
                'status' => ($result['success'] ?? false) ? 'success' : 'failed',
                'latency_ms' => $latency,
            ]);

            AuditLogger::log(
                $validOrg->id,
                'ai_tool_executed',
                'agent',
                $conversation->id ?? null,
                'tool_execution',
                $toolName,
                ['latency_ms' => $latency, 'status' => ($result['success'] ?? false) ? 'success' : 'failed']
            );
        }

        return $result;
    }

    // -------------------------------------------------------------
    // CRM Tool Implementations
    // -------------------------------------------------------------

    protected function searchContacts(string $orgId, array $input): array
    {
        $rawQuery = $input['query'] ?? null;
        $cleanQuery = $rawQuery ? AgentRouter::extractContactSearchQuery($rawQuery) : null;
        if (empty($cleanQuery) && !empty($rawQuery) && !preg_match('/^(contacts?|leads?)$/i', trim($rawQuery))) {
            $cleanQuery = trim($rawQuery);
        }

        $query = Contact::with(['tags', 'companies'])->where('organization_id', $orgId);

        if (!empty($cleanQuery)) {
            $query->where(function ($w) use ($cleanQuery) {
                $w->where('first_name', 'like', "%{$cleanQuery}%")
                  ->orWhere('last_name', 'like', "%{$cleanQuery}%")
                  ->orWhereRaw("first_name || ' ' || last_name like ?", ["%{$cleanQuery}%"])
                  ->orWhere('email', 'like', "%{$cleanQuery}%")
                  ->orWhere('phone', 'like', "%{$cleanQuery}%");
            });
        }

        if ($status = $input['status'] ?? null) {
            $query->where('status', $status);
        }

        // Order by latest created so newly added contacts appear at the top
        $query->orderBy('created_at', 'desc');

        // When listing all contacts or directory, return all records without truncation
        $results = empty($cleanQuery) ? $query->get() : $query->limit(50)->get();

        $formatted = $results->map(function ($c) {
            $companyNames = $c->companies->pluck('name')->filter()->values()->all();
            $tagNames = $c->tags->pluck('name')->filter()->values()->all();
            return [
                'id' => $c->id,
                'name' => trim("{$c->first_name} {$c->last_name}"),
                'first_name' => $c->first_name,
                'last_name' => $c->last_name,
                'email' => $c->email,
                'phone' => $c->phone,
                'status' => $c->status,
                'score' => $c->score,
                'company' => !empty($companyNames) ? implode(', ', $companyNames) : null,
                'tags' => $tagNames
            ];
        })->toArray();

        return [
            'success' => true,
            'count' => $results->count(),
            'query' => $cleanQuery ?? '',
            'data' => $results
        ];
    }

    protected function getContact(string $orgId, array $input): array
    {
        $contact = Contact::with(['tags', 'opportunities', 'tasks', 'companies'])->where('organization_id', $orgId)->find($input['contact_id']);
        if (!$contact) return ['success' => false, 'error' => 'Contact not found.'];
        return ['success' => true, 'data' => $contact];
    }

    protected function createContact(string $orgId, array $input): array
    {
        $email = $input['email'] ?? null;
        $firstName = $input['first_name'] ?? 'New';
        $lastName = $input['last_name'] ?? 'Contact';

        // Check for deduplication: if exact matching email exists in this tenant, reuse and update record
        if ($email) {
            $existing = Contact::where('organization_id', $orgId)->where('email', $email)->first();
            if ($existing) {
                $existing->update([
                    'first_name' => $firstName !== 'New' ? $firstName : $existing->first_name,
                    'last_name' => $lastName !== 'Contact' ? $lastName : $existing->last_name,
                    'phone' => $input['phone'] ?? $existing->phone,
                ]);
                return ['success' => true, 'data' => $existing, 'deduplicated' => true];
            }
        }

        $contact = Contact::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => $input['phone'] ?? null,
            'source' => $input['source'] ?? 'AI Agent',
            'status' => $input['status'] ?? 'Lead',
            'score' => $input['score'] ?? 20
        ]);
        return ['success' => true, 'data' => $contact];
    }

    protected function updateContact(string $orgId, array $input): array
    {
        $contact = Contact::where('organization_id', $orgId)->find($input['contact_id']);
        if (!$contact) return ['success' => false, 'error' => 'Contact not found.'];
        $contact->update(collect($input)->except('contact_id')->toArray());
        return ['success' => true, 'data' => $contact];
    }

    protected function addTag(string $orgId, array $input): array
    {
        $contact = Contact::where('organization_id', $orgId)->find($input['contact_id']);
        if (!$contact) return ['success' => false, 'error' => 'Contact not found.'];
        $tag = Tag::firstOrCreate(['organization_id' => $orgId, 'name' => $input['tag']]);
        $contact->tags()->syncWithoutDetaching([$tag->id]);
        return ['success' => true, 'message' => "Tag '{$input['tag']}' attached."];
    }

    protected function removeTag(string $orgId, array $input): array
    {
        $contact = Contact::where('organization_id', $orgId)->find($input['contact_id']);
        if (!$contact) return ['success' => false, 'error' => 'Contact not found.'];
        $tag = Tag::where('organization_id', $orgId)->where('name', $input['tag'])->first();
        if ($tag) $contact->tags()->detach($tag->id);
        return ['success' => true, 'message' => "Tag '{$input['tag']}' detached."];
    }

    /**
     * Delete a contact by ID or by name lookup.
     * Tenant-scoped: only deletes within the organization.
     */
    protected function deleteContact(string $orgId, array $input): array
    {
        $contact = null;

        // Prefer direct ID lookup
        if (!empty($input['contact_id'])) {
            $idPrefix = $input['contact_id'];
            // Support partial ID prefix matching (e.g. "a2bf2b7c")
            $contact = Contact::where('organization_id', $orgId)
                ->where('id', 'like', "{$idPrefix}%")
                ->first();
        }

        // Fallback to name lookup if no ID or ID didn't match
        if (!$contact && !empty($input['name'])) {
            $name = $input['name'];
            $contact = Contact::where('organization_id', $orgId)
                ->where(function ($w) use ($name) {
                    $w->where('first_name', 'like', "%{$name}%")
                      ->orWhere('last_name', 'like', "%{$name}%")
                      ->orWhereRaw("first_name || ' ' || last_name like ?", ["%{$name}%"]);
                })
                ->orderBy('created_at', 'desc')
                ->first();
        }

        if (!$contact) {
            return [
                'success' => false,
                'error' => 'Contact not found. Please provide a valid contact name or ID.'
            ];
        }

        $deletedName = trim("{$contact->first_name} {$contact->last_name}");
        $deletedId = $contact->id;
        $deletedEmail = $contact->email;

        $contact->delete();

        return [
            'success' => true,
            'deleted_id' => $deletedId,
            'deleted_name' => $deletedName,
            'deleted_email' => $deletedEmail,
            'message' => "Contact record '{$deletedName}' (ID: {$deletedId}) has been permanently deleted."
        ];
    }

    public function deduplicateContacts(string $orgId, array $input, ?Conversation $conversation = null): array
    {
        $target = trim($input['target_name'] ?? $input['name'] ?? $input['query'] ?? '');

        // If no target provided in input, try to resolve from conversation messages
        if (empty($target) && $conversation) {
            $recentMessages = $conversation->messages()
                ->orderBy('created_at', 'desc')
                ->limit(6)
                ->get();

            foreach ($recentMessages as $msg) {
                if (preg_match('/(?:check for|find|search for|contacts? for)\s+([A-Za-z0-9\.\-\_\s]+)/i', $msg->content, $m)) {
                    $cleaned = AgentRouter::extractContactSearchQuery($m[1]);
                    if (!empty($cleaned)) {
                        $target = $cleaned;
                        break;
                    }
                }
                $meta = is_array($msg->metadata_json) ? $msg->metadata_json : (json_decode($msg->metadata_json ?? '[]', true) ?? []);
                if (!empty($meta['toolExecuted']['output']['data'][0]['name'])) {
                    $target = $meta['toolExecuted']['output']['data'][0]['name'];
                    break;
                }
            }
        }

        $totalDeleted = 0;
        $affectedGroups = [];

        if (!empty($target) && !preg_match('/^(duplicates?|all|contacts?|records?)$/i', $target)) {
            $matchingContacts = Contact::where('organization_id', $orgId)
                ->where(function ($w) use ($target) {
                    $w->where('first_name', 'like', "%{$target}%")
                      ->orWhere('last_name', 'like', "%{$target}%")
                      ->orWhereRaw("first_name || ' ' || last_name like ?", ["%{$target}%"])
                      ->orWhere('email', 'like', "%{$target}%");
                })
                ->orderBy('created_at', 'asc')
                ->get();

            if ($matchingContacts->count() <= 1) {
                return [
                    'success' => true,
                    'deleted_count' => 0,
                    'message' => "No duplicate records found for {$target}."
                ];
            }

            $primary = $matchingContacts->first();
            $duplicates = $matchingContacts->slice(1);

            foreach ($duplicates as $dup) {
                $dup->delete();
                $totalDeleted++;
            }

            return [
                'success' => true,
                'deleted_count' => $totalDeleted,
                'primary_id' => $primary->id,
                'primary_name' => trim("{$primary->first_name} {$primary->last_name}"),
                'primary_email' => $primary->email,
                'message' => "Retained primary contact record (ID: {$primary->id}) and deleted {$totalDeleted} duplicate record(s)."
            ];
        }

        // Global deduplication across tenant
        $contacts = Contact::where('organization_id', $orgId)
            ->orderBy('created_at', 'asc')
            ->get();

        $grouped = $contacts->groupBy(function ($c) {
            $email = strtolower(trim($c->email ?? ''));
            if (!empty($email)) return "email:{$email}";
            $name = strtolower(trim("{$c->first_name} {$c->last_name}"));
            return "name:{$name}";
        });

        foreach ($grouped as $key => $group) {
            if ($group->count() > 1) {
                $primary = $group->first();
                $duplicates = $group->slice(1);
                foreach ($duplicates as $dup) {
                    $dup->delete();
                    $totalDeleted++;
                }
                $affectedGroups[] = trim("{$primary->first_name} {$primary->last_name}");
            }
        }

        return [
            'success' => true,
            'deleted_count' => $totalDeleted,
            'affected_contacts' => array_unique($affectedGroups),
            'message' => $totalDeleted > 0
                ? "Deduplicated {$totalDeleted} duplicate contact record(s) across " . count(array_unique($affectedGroups)) . " contact(s)."
                : "No duplicate contact records found to clean up."
        ];
    }


    protected function searchCompanies(string $orgId, array $input): array
    {
        $q = $input['query'] ?? '';
        $companies = Company::where('organization_id', $orgId)
            ->where('name', 'like', "%{$q}%")
            ->limit(10)->get();
        return ['success' => true, 'data' => $companies];
    }

    protected function getCompany(string $orgId, array $input): array
    {
        $company = Company::with('contacts')->where('organization_id', $orgId)->find($input['company_id']);
        return $company ? ['success' => true, 'data' => $company] : ['success' => false, 'error' => 'Company not found.'];
    }

    protected function createCompany(string $orgId, array $input): array
    {
        $company = Company::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'name' => $input['name'],
            'domain' => $input['domain'] ?? null,
            'industry' => $input['industry'] ?? null
        ]);
        return ['success' => true, 'data' => $company];
    }

    protected function searchLeads(string $orgId, array $input): array
    {
        $companyName = $input['company_name'] ?? null;
        $companyId = $input['company_id'] ?? null;

        $query = Contact::with(['tags', 'companies'])->where('organization_id', $orgId);

        if ($companyId) {
            $query->whereHas('companies', fn($c) => $c->where('companies.id', $companyId));
        } elseif ($companyName) {
            $query->whereHas('companies', fn($c) => $c->where('name', 'like', "%{$companyName}%"));
        } else {
            $query->whereIn('status', ['Lead', 'Prospect', 'Hot']);
        }

        $leads = $query->limit(15)->get();

        $formatted = $leads->map(function ($c) {
            $company = $c->companies->pluck('name')->first();
            return [
                'id' => $c->id,
                'name' => trim("{$c->first_name} {$c->last_name}"),
                'email' => $c->email,
                'phone' => $c->phone,
                'status' => $c->status,
                'company' => $company
            ];
        })->toArray();

        return [
            'success' => true,
            'count' => count($formatted),
            'company' => $companyName,
            'data' => $formatted
        ];
    }

    protected function searchOpportunities(string $orgId, array $input): array
    {
        $query = Opportunity::with(['stage', 'contact'])->where('organization_id', $orgId);

        if (!empty($input['contact_id'])) {
            $query->where('contact_id', $input['contact_id']);
        } elseif (!empty($input['contact_name'])) {
            $cName = $input['contact_name'];
            $query->whereHas('contact', function ($q) use ($cName) {
                $q->where('first_name', 'like', "%{$cName}%")
                  ->orWhere('last_name', 'like', "%{$cName}%")
                  ->orWhereRaw("first_name || ' ' || last_name like ?", ["%{$cName}%"]);
            });
        }

        if (!empty($input['query'])) {
            $q = $input['query'];
            $query->where(function ($w) use ($q) {
                $w->where('title', 'like', "%{$q}%")
                  ->orWhereHas('contact', function ($c) use ($q) {
                      $c->where('first_name', 'like', "%{$q}%")
                        ->orWhere('last_name', 'like', "%{$q}%")
                        ->orWhereRaw("first_name || ' ' || last_name like ?", ["%{$q}%"]);
                  });
            });
        }

        if ($status = $input['status'] ?? null) {
            $query->where('status', $status);
        }

        $results = $query->limit(15)->get();

        $formatted = $results->map(function ($opp) {
            return [
                'id' => $opp->id,
                'title' => $opp->title,
                'value' => (float) $opp->value,
                'status' => $opp->status,
                'stage' => $opp->stage?->name ?? 'Open',
                'contact_name' => $opp->contact ? trim("{$opp->contact->first_name} {$opp->contact->last_name}") : null,
                'contact_email' => $opp->contact?->email
            ];
        })->toArray();

        return [
            'success' => true,
            'count' => count($formatted),
            'data' => $formatted
        ];
    }

    protected function summarizeConversation(string $orgId, array $input, ?Conversation $conversation = null): array
    {
        $convId = $input['conversation_id'] ?? $conversation?->id;
        if (!$convId) {
            return [
                'success' => false,
                'need_clarification' => true,
                'error' => 'No conversation is currently selected. Please specify which customer or conversation you would like summarized.'
            ];
        }

        $conv = Conversation::with(['customer', 'messages'])->where('organization_id', $orgId)->find($convId);
        if (!$conv) {
            return ['success' => false, 'error' => 'Conversation record not found in database.'];
        }

        $messages = $conv->messages()->orderBy('created_at', 'asc')->get();
        if ($messages->isEmpty()) {
            return [
                'success' => true,
                'empty' => true,
                'customer_name' => $conv->customer?->name ?? 'Customer',
                'summary' => "There are no recorded messages in this conversation yet."
            ];
        }

        $customerName = $conv->customer?->name ?? 'Customer';
        $summaryPoints = ["Conversation summary for {$customerName} ({$messages->count()} messages recorded):"];

        foreach ($messages->take(8) as $m) {
            $sender = $m->sender_type === 'customer' ? $customerName : 'Agent';
            $preview = Str::limit($m->content, 80);
            $summaryPoints[] = "• {$sender}: \"{$preview}\"";
        }

        return [
            'success' => true,
            'customer_name' => $customerName,
            'message_count' => $messages->count(),
            'summary' => implode("\n", $summaryPoints)
        ];
    }

    protected function createOpportunity(string $orgId, array $input): array
    {
        $pipeline = Pipeline::where('organization_id', $orgId)->first();
        $stage = $pipeline ? $pipeline->stages()->first() : null;

        $opp = Opportunity::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'title' => $input['title'],
            'value' => (float) ($input['value'] ?? 0),
            'pipeline_id' => $input['pipeline_id'] ?? ($pipeline->id ?? (string) Str::uuid()),
            'stage_id' => $input['stage_id'] ?? ($stage->id ?? (string) Str::uuid()),
            'contact_id' => $input['contact_id'] ?? null,
            'status' => 'open'
        ]);
        return ['success' => true, 'data' => $opp];
    }

    protected function moveStage(string $orgId, array $input): array
    {
        $opp = Opportunity::where('organization_id', $orgId)->find($input['opportunity_id']);
        if (!$opp) return ['success' => false, 'error' => 'Opportunity not found.'];
        $opp->update(['stage_id' => $input['stage_id']]);
        return ['success' => true, 'data' => $opp->load('stage')];
    }

    protected function closeOpportunity(string $orgId, array $input): array
    {
        $opp = Opportunity::where('organization_id', $orgId)->find($input['opportunity_id']);
        if (!$opp) return ['success' => false, 'error' => 'Opportunity not found.'];
        $status = in_array($input['status'], ['won', 'lost']) ? $input['status'] : 'won';
        $opp->update(['status' => $status]);
        return ['success' => true, 'data' => $opp];
    }

    protected function createTask(string $orgId, array $input): array
    {
        $contactId = $input['contact_id'] ?? null;
        if (!$contactId && !empty($input['contact_name'])) {
            $cName = $input['contact_name'];
            $c = Contact::where('organization_id', $orgId)
                ->where(function ($w) use ($cName) {
                    $w->where('first_name', 'like', "%{$cName}%")
                      ->orWhere('last_name', 'like', "%{$cName}%")
                      ->orWhereRaw("first_name || ' ' || last_name like ?", ["%{$cName}%"]);
                })->first();
            if ($c) $contactId = $c->id;
        }

        $task = Task::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'title' => $input['title'],
            'priority' => $input['priority'] ?? 'medium',
            'status' => 'pending',
            'due_date' => now()->addDays((int) ($input['due_days'] ?? 1)),
            'contact_id' => $contactId,
            'opportunity_id' => $input['opportunity_id'] ?? null
        ]);
        return ['success' => true, 'data' => $task];
    }

    protected function completeTask(string $orgId, array $input): array
    {
        $task = Task::where('organization_id', $orgId)->find($input['task_id']);
        if (!$task) return ['success' => false, 'error' => 'Task not found.'];
        $task->update(['status' => 'completed']);
        return ['success' => true, 'data' => $task];
    }

    protected function getCalendarAvailability(string $orgId, array $input): array
    {
        $date = $input['date'] ?? date('Y-m-d', strtotime('+1 day'));
        $allSlots = [
            '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
            '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM',
            '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
            '04:00 PM', '04:30 PM'
        ];

        $bookedApts = Appointment::where('organization_id', $orgId)
            ->where('date', $date)
            ->where('status', '!=', 'Cancelled')
            ->get();

        $bookedSlots = [];
        foreach ($bookedApts as $apt) {
            $aptTime = trim($apt->time);
            if ($aptTime) {
                $formattedTime = date('h:i A', strtotime($aptTime));
                $bookedSlots[] = $formattedTime;
            }
        }

        $availableSlots = array_values(array_filter($allSlots, function ($slot) use ($bookedSlots) {
            return !in_array($slot, $bookedSlots);
        }));

        return [
            'success' => true,
            'date' => $date,
            'available_slots' => $availableSlots,
            'booked_slots' => array_values(array_unique($bookedSlots))
        ];
    }

    protected function createAppointment(string $orgId, array $input): array
    {
        $customerName = $input['customer_name'] ?? 'Guest Customer';
        $customer = \App\Models\Customer::firstOrCreate(
            ['organization_id' => $orgId, 'name' => $customerName],
            ['id' => (string) Str::uuid(), 'source' => 'ai_appointment_agent']
        );

        $date = $input['date'] ?? date('Y-m-d', strtotime('+1 day'));
        $time = $input['time'] ?? '10:00 AM';

        try {
            $startAt = \Carbon\Carbon::parse("{$date} {$time}");
        } catch (\Throwable $e) {
            $startAt = now()->addDay()->setTime(10, 0);
        }
        $endAt = (clone $startAt)->addMinutes(30);

        $apt = Appointment::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'customer_id' => $customer->id,
            'title' => $input['title'] ?? 'Product Demo',
            'customer_name' => $customerName,
            'date' => $date,
            'time' => $time,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'service' => $input['service'] ?? 'Sales Consultation',
            'status' => 'Confirmed',
            'provider' => 'Google Calendar'
        ]);
        return ['success' => true, 'data' => $apt];
    }

    protected function searchAppointments(string $orgId, array $input): array
    {
        $query = Appointment::where('organization_id', $orgId);

        if (!empty($input['status'])) {
            $query->where('status', $input['status']);
        } else {
            $query->where('status', '!=', 'Cancelled');
        }

        if (!empty($input['date'])) {
            $query->where('date', $input['date']);
        }

        if (!empty($input['customer_name'])) {
            $cName = $input['customer_name'];
            $query->where(function($w) use ($cName) {
                $w->where('customer_name', 'like', "%{$cName}%")
                  ->orWhere('title', 'like', "%{$cName}%");
            });
        }

        $results = $query->orderBy('date', 'asc')->orderBy('time', 'asc')->get();

        return [
            'success' => true,
            'count' => $results->count(),
            'data' => $results
        ];
    }

    protected function rescheduleAppointment(string $orgId, array $input): array
    {
        $apt = Appointment::where('organization_id', $orgId)->find($input['appointment_id']);
        if (!$apt) return ['success' => false, 'error' => 'Appointment not found.'];
        $apt->update(['date' => $input['new_date'], 'time' => $input['new_time'], 'status' => 'Rescheduled']);
        return ['success' => true, 'data' => $apt];
    }

    protected function cancelAppointment(string $orgId, array $input): array
    {
        $apt = Appointment::where('organization_id', $orgId)->find($input['appointment_id']);
        if (!$apt) return ['success' => false, 'error' => 'Appointment not found.'];
        $apt->update(['status' => 'Cancelled']);
        return ['success' => true, 'data' => $apt];
    }

    protected function listWorkflows(string $orgId): array
    {
        $workflows = Workflow::where('organization_id', $orgId)->select('id', 'name', 'status', 'trigger_type')->get();
        return ['success' => true, 'data' => $workflows];
    }

    protected function executeWorkflow(string $orgId, array $input): array
    {
        $workflow = Workflow::where('organization_id', $orgId)->find($input['workflow_id']);
        if (!$workflow) return ['success' => false, 'error' => 'Workflow not found.'];
        $engine = new WorkflowEngine();
        $execution = $engine->startExecution($workflow, 'AI_Tool_Execution', 'contact', (string) Str::uuid(), $input['context'] ?? []);
        return ['success' => true, 'data' => $execution->load('steps')];
    }

    protected function pipelineReport(string $orgId): array
    {
        $opps = Opportunity::where('organization_id', $orgId)->get();
        return [
            'success' => true,
            'total_deals' => $opps->count(),
            'total_value' => (float) $opps->sum('value'),
            'won_value' => (float) $opps->where('status', 'won')->sum('value'),
            'open_deals' => $opps->where('status', 'open')->count()
        ];
    }

    protected function leadsReport(string $orgId): array
    {
        $contacts = Contact::where('organization_id', $orgId)->get();
        return [
            'success' => true,
            'total_contacts' => $contacts->count(),
            'hot_leads' => $contacts->where('status', 'Hot')->count(),
            'qualified' => $contacts->where('status', 'Qualified')->count()
        ];
    }

    protected function searchKnowledge(string $orgId, array $input): array
    {
        $rag = new \App\Services\Knowledge\RAGService();
        $results = $rag->search($orgId, $input['query'] ?? '', 3);
        return [
            'success' => true,
            'query' => $input['query'] ?? '',
            'count' => count($results),
            'data' => $results
        ];
    }

    protected function getOrderStatus(string $orgId, array $input): array
    {
        $orderId = $input['order_id'] ?? $input['order_number'] ?? null;
        if (!$orderId) {
            return ['success' => false, 'error' => 'Please provide an order number or ID to look up.'];
        }

        // 1. Check WooCommerce integration
        try {
            if (class_exists(\App\Services\Ecommerce\WooCommerceService::class)) {
                $wooService = app(\App\Services\Ecommerce\WooCommerceService::class);
                $wooOrder = $wooService->getOrder((int) $orderId);
                if ($wooOrder && !empty($wooOrder['id'])) {
                    return [
                        'success' => true,
                        'provider' => 'WooCommerce',
                        'order_id' => $wooOrder['id'],
                        'status' => $wooOrder['status'] ?? 'processing',
                        'total' => $wooOrder['total'] ?? '0.00',
                        'currency' => $wooOrder['currency'] ?? 'USD',
                        'date_created' => $wooOrder['date_created'] ?? null,
                        'line_items' => array_map(fn($item) => $item['name'] ?? 'Product', $wooOrder['line_items'] ?? [])
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::debug("WooCommerce getOrder lookup error: " . $e->getMessage());
        }

        // 2. Check Shopify integration
        try {
            if (class_exists(\App\Services\Ecommerce\ShopifyService::class)) {
                $shopifyService = app(\App\Services\Ecommerce\ShopifyService::class);
                $shopifyOrder = $shopifyService->getOrder($orderId);
                if ($shopifyOrder && !empty($shopifyOrder['id'])) {
                    return [
                        'success' => true,
                        'provider' => 'Shopify',
                        'order_id' => $shopifyOrder['id'],
                        'status' => $shopifyOrder['fulfillment_status'] ?? 'unfulfilled',
                        'total' => $shopifyOrder['total_price'] ?? '0.00',
                        'date_created' => $shopifyOrder['created_at'] ?? null,
                        'line_items' => array_map(fn($item) => $item['title'] ?? 'Item', $shopifyOrder['line_items'] ?? [])
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::debug("Shopify getOrder lookup error: " . $e->getMessage());
        }

        return [
            'success' => false,
            'error' => "Order #{$orderId} was not found in your connected WooCommerce or Shopify store."
        ];
    }

    protected function handoffToHuman(?Conversation $conversation): array
    {
        if ($conversation) {
            $conversation->update([
                'status' => 'waiting_for_human',
                'assigned_agent' => 'human'
            ]);
        }
        return [
            'success' => true,
            'message' => 'Conversation has been escalated to a human agent queue.'
        ];
    }

    public function getToolDeclarations(string $agentType = 'assistant'): array
    {
        $allowed = $this->agentToolAllowlist[$agentType] ?? $this->agentToolAllowlist['assistant'];
        $all = [
            'search_contacts' => [
                'name' => 'search_contacts',
                'description' => 'Search CRM contacts by name, email, phone, or status',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'query' => ['type' => 'STRING', 'description' => 'Contact name, email, or search string e.g. Muhammad Okasha'],
                        'status' => ['type' => 'STRING', 'description' => 'Contact status filter']
                    ]
                ]
            ],
            'create_contact' => [
                'name' => 'create_contact',
                'description' => 'Create a new CRM contact lead record',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'first_name' => ['type' => 'STRING'],
                        'last_name' => ['type' => 'STRING'],
                        'email' => ['type' => 'STRING'],
                        'phone' => ['type' => 'STRING'],
                        'status' => ['type' => 'STRING'],
                        'score' => ['type' => 'NUMBER']
                    ],
                    'required' => ['first_name']
                ]
            ],
            'update_contact' => [
                'name' => 'update_contact',
                'description' => 'Update an existing CRM contact by ID',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'contact_id' => ['type' => 'STRING'],
                        'status' => ['type' => 'STRING'],
                        'score' => ['type' => 'NUMBER']
                    ],
                    'required' => ['contact_id']
                ]
            ],
            'add_tag' => [
                'name' => 'add_tag',
                'description' => 'Attach a CRM tag to a contact',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'contact_id' => ['type' => 'STRING'],
                        'tag' => ['type' => 'STRING']
                    ],
                    'required' => ['contact_id', 'tag']
                ]
            ],
            'remove_tag' => [
                'name' => 'remove_tag',
                'description' => 'Remove a CRM tag from a contact',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'contact_id' => ['type' => 'STRING'],
                        'tag' => ['type' => 'STRING']
                    ],
                    'required' => ['contact_id', 'tag']
                ]
            ],
            'search_opportunities' => [
                'name' => 'search_opportunities',
                'description' => 'Search sales pipeline opportunities and deals by contact name, title, or status',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'contact_name' => ['type' => 'STRING', 'description' => 'Contact full or partial name e.g. Muhammad Okasha'],
                        'query' => ['type' => 'STRING', 'description' => 'Keyword query on opportunity title or contact'],
                        'status' => ['type' => 'STRING', 'description' => 'open, won, lost']
                    ]
                ]
            ],
            'search_leads' => [
                'name' => 'search_leads',
                'description' => 'Search leads and prospective customer contacts by company or status',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'company_name' => ['type' => 'STRING', 'description' => 'Company name e.g. Acme Corp'],
                        'company_id' => ['type' => 'STRING', 'description' => 'Company UUID']
                    ]
                ]
            ],
            'get_company_leads' => [
                'name' => 'get_company_leads',
                'description' => 'Find all leads belonging to a specific company',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'company_name' => ['type' => 'STRING', 'description' => 'Target company name']
                    ],
                    'required' => ['company_name']
                ]
            ],
            'summarize_conversation' => [
                'name' => 'summarize_conversation',
                'description' => 'Summarize chat messages and discussion points of the active conversation',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'conversation_id' => ['type' => 'STRING', 'description' => 'Optional UUID of conversation to summarize']
                    ]
                ]
            ],
            'create_opportunity' => [
                'name' => 'create_opportunity',
                'description' => 'Create a new sales opportunity deal in the CRM pipeline',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'title' => ['type' => 'STRING'],
                        'value' => ['type' => 'NUMBER'],
                        'contact_id' => ['type' => 'STRING']
                    ],
                    'required' => ['title']
                ]
            ],
            'move_stage' => [
                'name' => 'move_stage',
                'description' => 'Move an opportunity deal to a new stage in the pipeline',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'opportunity_id' => ['type' => 'STRING'],
                        'stage_id' => ['type' => 'STRING']
                    ],
                    'required' => ['opportunity_id', 'stage_id']
                ]
            ],
            'create_task' => [
                'name' => 'create_task',
                'description' => 'Create a CRM follow-up task',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'title' => ['type' => 'STRING'],
                        'priority' => ['type' => 'STRING'],
                        'due_days' => ['type' => 'NUMBER'],
                        'contact_name' => ['type' => 'STRING'],
                        'contact_id' => ['type' => 'STRING']
                    ],
                    'required' => ['title']
                ]
            ],
            'complete_task' => [
                'name' => 'complete_task',
                'description' => 'Mark a CRM task as completed',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'task_id' => ['type' => 'STRING']
                    ],
                    'required' => ['task_id']
                ]
            ],
            'get_calendar_availability' => [
                'name' => 'get_calendar_availability',
                'description' => 'Check available appointment time slots for a given date',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'date' => ['type' => 'STRING', 'description' => 'Date in YYYY-MM-DD']
                    ]
                ]
            ],
            'create_appointment' => [
                'name' => 'create_appointment',
                'description' => 'Book an appointment / meeting in the calendar',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'title' => ['type' => 'STRING'],
                        'customer_name' => ['type' => 'STRING'],
                        'date' => ['type' => 'STRING'],
                        'time' => ['type' => 'STRING'],
                        'service' => ['type' => 'STRING']
                    ],
                    'required' => ['title', 'customer_name', 'date', 'time']
                ]
            ],
            'search_appointments' => [
                'name' => 'search_appointments',
                'description' => 'Search or list upcoming scheduled meetings and appointments in the calendar',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'date' => ['type' => 'STRING', 'description' => 'Filter by date YYYY-MM-DD'],
                        'customer_name' => ['type' => 'STRING', 'description' => 'Filter by client or meeting name'],
                        'status' => ['type' => 'STRING', 'description' => 'Filter by status (Confirmed, Pending, etc.)']
                    ]
                ]
            ],
            'pipeline_report' => [
                'name' => 'pipeline_report',
                'description' => 'Retrieve aggregate pipeline revenue and opportunity metrics',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => new \stdClass()
                ]
            ],
            'leads_report' => [
                'name' => 'leads_report',
                'description' => 'Retrieve lead generation statistics and status breakdown',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => new \stdClass()
                ]
            ],
            'handoff_to_human' => [
                'name' => 'handoff_to_human',
                'description' => 'Escalate conversation to human support representative',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => new \stdClass()
                ]
            ],
            'search_knowledge' => [
                'name' => 'search_knowledge',
                'description' => 'Search knowledge base documentation and policy chunks',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'query' => ['type' => 'STRING']
                    ],
                    'required' => ['query']
                ]
            ],
            'get_order_status' => [
                'name' => 'get_order_status',
                'description' => 'Retrieve status and line items for an order by ID or order number',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'order_number' => ['type' => 'STRING', 'description' => 'Order ID or tracking number']
                    ],
                    'required' => ['order_number']
                ]
            ],
            'deduplicate_contacts' => [
                'name' => 'deduplicate_contacts',
                'description' => 'Find and delete duplicate contact records in the database, retaining only the primary record.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'target_name' => ['type' => 'STRING', 'description' => 'Name or email of the contact to deduplicate']
                    ]
                ]
            ],
            'delete_contact' => [
                'name' => 'delete_contact',
                'description' => 'Permanently delete a CRM contact record by ID or name',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'contact_id' => ['type' => 'STRING', 'description' => 'Full or partial UUID of the contact to delete'],
                        'name' => ['type' => 'STRING', 'description' => 'Name of the contact to delete']
                    ]
                ]
            ]
        ];

        $declarations = [];
        foreach ($allowed as $tool) {
            if (isset($all[$tool])) {
                $declarations[] = $all[$tool];
            }
        }
        return $declarations;
    }
}
