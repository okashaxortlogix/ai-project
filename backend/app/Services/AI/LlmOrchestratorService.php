<?php

namespace App\Services\AI;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Contact;
use App\Models\Opportunity;
use App\Models\Appointment;
use App\Models\Task;
use App\Tools\ToolRegistry;
use App\Services\Knowledge\RAGService;
use App\Services\Agents\AgentRouter;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LlmOrchestratorService
{
    protected ToolRegistry $toolRegistry;
    protected RAGService $ragService;
    protected AgentRouter $agentRouter;

    public function __construct()
    {
        $this->toolRegistry = new ToolRegistry();
        $this->ragService = new RAGService();
        $this->agentRouter = new AgentRouter();
    }

    /**
     * Process message through LLM function calling and real tool execution.
     */
    public function processMessage(
        string $organizationId,
        ?string $conversationId,
        string $userMessage,
        string $agentType = 'assistant',
        ?string $customerName = null,
        array $history = []
    ): array {
        $conversation = $conversationId ? Conversation::where('organization_id', $organizationId)->find($conversationId) : null;

        // 1. Deterministic Intent Classification for Current Turn
        $detectedIntent = $this->agentRouter->detectIntent($userMessage);

        // Map detected intent to appropriate specialist agent if not hardcoded to assistant
        $effectiveAgentType = match ($detectedIntent) {
            'CONTACT_SEARCH', 'CONTACT_CREATE', 'CONTACT_UPDATE', 'CONTACT_DELETE',
            'COMPANY_SEARCH', 'COMPANY_CREATE',
            'TASK_CREATE', 'TASK_COMPLETE', 'TASK_SEARCH',
            'CONVERSATION_SUMMARY', 'CAPABILITIES_QUERY',
            'ANALYTICS_QUERY' => 'assistant',
            
            'OPPORTUNITY_CREATE', 'OPPORTUNITY_SEARCH', 'PIPELINE_REPORT' => 'sales',
            
            'APPOINTMENT_AVAILABILITY', 'APPOINTMENT_BOOK', 'APPOINTMENT_SEARCH',
            'APPOINTMENT_RESCHEDULE', 'APPOINTMENT_CANCEL' => 'appointment',
            
            'ORDER_STATUS', 'ORDER_TRACK', 'ORDER_CANCEL' => 'support',
            'KNOWLEDGE_QUERY' => 'support',
            'HUMAN_REQUEST' => 'support',
            
            default => $agentType ?: 'assistant',
        };

        // 2. Contextual RAG Grounding (Only search KB when relevant or general)
        $groundingContext = '';
        $ragChunks = [];
        if (in_array($detectedIntent, ['KNOWLEDGE_QUERY', 'GENERAL_CHAT']) || str_contains(strtolower($userMessage), 'policy')) {
            $ragChunks = $this->ragService->search($organizationId, $userMessage, 2);
            $groundingContext = !empty($ragChunks) ? $ragChunks[0]['chunk'] : 'No company knowledge base match found.';
        }

        // 3. Fetch Tool Declarations for the effective agent
        $tools = $this->toolRegistry->getToolDeclarations($effectiveAgentType);

        // 4. Attempt Live LLM API with Function Calling if available
        $geminiKey = env('GEMINI_API_KEY');
        $toolExecuted = null;
        $reply = null;

        if ($geminiKey && !str_starts_with($geminiKey, 'your_')) {
            try {
                $llmResult = $this->callGemini(
                    $geminiKey,
                    $effectiveAgentType,
                    $userMessage,
                    $groundingContext,
                    $tools,
                    $organizationId,
                    $conversation,
                    $history
                );
                if ($llmResult) {
                    $reply = $llmResult['reply'];
                    $toolExecuted = $llmResult['toolExecuted'];
                }
            } catch (\Throwable $e) {
                Log::warning("Gemini LLM call failed: " . $e->getMessage());
            }
        }

        // 5. Multi-Intent & Deterministic Flow Execution (Zero-Hallucination Real DB Ops)
        $multiIntents = $this->agentRouter->detectMultiIntents($userMessage);
        $toolsExecutedList = [];

        if (count($multiIntents) >= 2) {
            $multiReplies = [];
            foreach ($multiIntents as $sub) {
                $subFlow = $this->executeDeterministicFlow(
                    $organizationId,
                    $sub['query'],
                    $sub['intent'],
                    $effectiveAgentType,
                    $conversation,
                    $groundingContext
                );
                if (!empty($subFlow['reply'])) {
                    $multiReplies[] = $subFlow['reply'];
                }
                if (!empty($subFlow['toolExecuted'])) {
                    $toolsExecutedList[] = $subFlow['toolExecuted'];
                }
            }
            $reply = implode("\n\n", $multiReplies);
            $toolExecuted = !empty($toolsExecutedList) ? $toolsExecutedList[0] : null;
            $detectedIntent = 'MULTI_INTENT';
        } elseif (!$reply) {
            $flowResult = $this->executeDeterministicFlow(
                $organizationId,
                $userMessage,
                $detectedIntent,
                $effectiveAgentType,
                $conversation,
                $groundingContext
            );
            $reply = $flowResult['reply'];
            $toolExecuted = $flowResult['toolExecuted'];
            if ($toolExecuted) {
                $toolsExecutedList[] = $toolExecuted;
            }
        }

        // 6. Store message history in database
        if ($conversation) {
            Message::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $organizationId,
                'conversation_id' => $conversation->id,
                'sender_type' => 'customer',
                'sender' => $customerName ?? 'Customer',
                'content' => $userMessage,
                'content_type' => 'text',
                'timestamp' => now()->format('h:i A')
            ]);

            Message::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $organizationId,
                'conversation_id' => $conversation->id,
                'sender_type' => 'agent',
                'sender' => 'agent',
                'agent_type' => $effectiveAgentType,
                'content' => $reply,
                'content_type' => 'text',
                'timestamp' => now()->format('h:i A'),
                'metadata' => [
                    'toolExecuted' => $toolExecuted,
                    'intentDetected' => $detectedIntent,
                    'groundedSource' => !empty($ragChunks) ? ($ragChunks[0]['title'] ?? null) : null
                ],
                'metadata_json' => [
                    'toolExecuted' => $toolExecuted,
                    'intentDetected' => $detectedIntent,
                    'groundedSource' => !empty($ragChunks) ? ($ragChunks[0]['title'] ?? null) : null
                ]
            ]);

            $conversation->update([
                'last_message' => $reply,
                'last_message_at' => now(),
                'assigned_agent' => $effectiveAgentType
            ]);
        }

        return [
            'success' => true,
            'reply' => $reply,
            'agent_type' => $effectiveAgentType,
            'intent_detected' => $detectedIntent,
            'tool_executed' => $toolExecuted,
            'toolExecuted' => $toolExecuted,
            'tools_executed' => $toolsExecutedList,
            'toolsExecuted' => $toolsExecutedList,
            'grounded_source' => !empty($ragChunks) ? ($ragChunks[0]['title'] ?? null) : null
        ];
    }

    /**
     * Executes real CRM/Database operations deterministically with zero hallucination.
     */
    protected function executeDeterministicFlow(
        string $orgId,
        string $userMessage,
        string $intent,
        string $agentType,
        ?Conversation $conversation,
        string $groundingContext
    ): array {
        $lower = strtolower(trim($userMessage));
        $toolExecuted = null;
        $reply = '';

        switch ($intent) {
            // -------------------------------------------------------------
            // CONTACT SEARCH
            // -------------------------------------------------------------
            case 'CONTACT_SEARCH':
                $searchQuery = AgentRouter::extractContactSearchQuery($userMessage);
                $searchRes = $this->toolRegistry->execute('assistant', 'search_contacts', [
                    'query' => $searchQuery
                ], $conversation, $orgId);

                $toolExecuted = [
                    'name' => 'search_contacts',
                    'toolName' => 'search_contacts',
                    'output' => $searchRes,
                    'result' => $searchRes
                ];

                $count = $searchRes['count'] ?? 0;
                $data = $searchRes['data'] ?? [];

                if ($count === 0) {
                    if (!empty($searchQuery)) {
                        $reply = "I searched your contacts for \"{$searchQuery}\", but no matching contact record was found in your database.";
                    } else {
                        $reply = "No contacts were found in your CRM database.";
                    }
                } elseif ($count === 1) {
                    $c = $data[0];
                    $isDetailQuery = (bool) preg_match('/\b(details?|info|information|profile|record|everything|who\s+is|who\'?s|tell\s+me\s+about)\b/i', $userMessage);

                    $details = [];
                    if (!empty($c['email'])) {
                        $details[] = "Email: {$c['email']}";
                    } elseif ($isDetailQuery) {
                        $details[] = "Email: None";
                    }

                    if (!empty($c['phone'])) {
                        $details[] = "Phone: {$c['phone']}";
                    } elseif ($isDetailQuery) {
                        $details[] = "Phone: None";
                    }

                    if (!empty($c['status'])) $details[] = "Status: {$c['status']}";
                    if ($isDetailQuery && isset($c['score'])) $details[] = "Lead Score: {$c['score']}";
                    if ($isDetailQuery && !empty($c['source'])) $details[] = "Source: {$c['source']}";
                    
                    $compStr = null;
                    if (!empty($c->companies) && $c->companies instanceof \Illuminate\Support\Collection) {
                        $compStr = $c->companies->pluck('name')->filter()->implode(', ');
                    } elseif (!empty($c['company'])) {
                        $compStr = is_array($c['company']) ? implode(', ', $c['company']) : (string) $c['company'];
                    }
                    if (!empty($compStr)) {
                        $details[] = "Company: {$compStr}";
                    } elseif ($isDetailQuery) {
                        $details[] = "Company: None";
                    }

                    $tagStr = null;
                    if (!empty($c->tags) && $c->tags instanceof \Illuminate\Support\Collection) {
                        $tagStr = $c->tags->pluck('name')->filter()->implode(', ');
                    } elseif (!empty($c['tags'])) {
                        $tagStr = is_array($c['tags']) ? implode(', ', $c['tags']) : (string) $c['tags'];
                    }
                    if (!empty($tagStr)) $details[] = "Tags: {$tagStr}";

                    if (!empty($c['custom_attributes']) && is_array($c['custom_attributes'])) {
                        foreach ($c['custom_attributes'] as $attrKey => $attrVal) {
                            $details[] = ucfirst($attrKey) . ": " . (is_array($attrVal) ? json_encode($attrVal) : $attrVal);
                        }
                    }

                    if (!empty($c['id'])) {
                        $details[] = "ID: {$c['id']}";
                    }

                    if ($isDetailQuery) {
                        $detailLines = implode("\n• ", $details);
                        $reply = "Here are the details for **{$c['name']}**:\n• {$detailLines}";
                    } else {
                        $detailStr = implode(' | ', $details);
                        $reply = "I found **{$c['name']}** in your contacts.\n{$detailStr}";
                    }
                } else {
                    $list = [];
                    foreach ($data as $c) {
                        $info = $c['name'];
                        if (!empty($c['email'])) $info .= " ({$c['email']})";
                        if (!empty($c['phone'])) $info .= " - {$c['phone']}";
                        if (!empty($c['id'])) $info .= " [ID: " . substr($c['id'], 0, 8) . "...]";
                        $list[] = "• " . $info;
                    }
                    $items = implode("\n", $list);
                    $reply = "Found {$count} matching contacts in your CRM:\n{$items}";
                }
                break;

            // -------------------------------------------------------------
            // CONTACT COUNT / TOTAL STATS & ANALYTICS
            // -------------------------------------------------------------
            case 'CONTACT_COUNT':
                $q = Contact::where('organization_id', $orgId);
                if (preg_match('/\b(hot|warm|cold)\b/i', $userMessage, $sm)) {
                    $st = ucfirst(strtolower($sm[1]));
                    $q->where('status', $st);
                    $totalCount = $q->count();
                    $reply = "You have **{$totalCount}** {$st} contact(s) saved in your CRM database.";
                } else {
                    $totalCount = $q->count();
                    $reply = "You currently have **{$totalCount}** contact(s) saved in your CRM database.";
                }
                $toolExecuted = [
                    'name' => 'search_contacts',
                    'toolName' => 'search_contacts',
                    'output' => ['total_count' => $totalCount, 'query' => $userMessage],
                    'result' => ['total_count' => $totalCount, 'query' => $userMessage]
                ];
                break;

            case 'ANALYTICS_QUERY':
                $totalContacts = Contact::where('organization_id', $orgId)->count();
                $totalDeals = Opportunity::where('organization_id', $orgId)->count();
                $reply = "CRM Analytics Summary: **{$totalContacts}** total contacts and **{$totalDeals}** active deals in your database.";
                $toolExecuted = [
                    'name' => 'search_contacts',
                    'toolName' => 'search_contacts',
                    'output' => ['total_contacts' => $totalContacts, 'total_deals' => $totalDeals],
                    'result' => ['total_contacts' => $totalContacts, 'total_deals' => $totalDeals]
                ];
                break;

            // -------------------------------------------------------------
            // CONTACT CREATE
            // -------------------------------------------------------------
            case 'CONTACT_CREATE':
                $parsed = AgentRouter::extractContactCreationData($userMessage);
                $firstName = $parsed['first_name'];
                $lastName = $parsed['last_name'];
                $email = $parsed['email'];
                $phone = $parsed['phone'];

                $cRes = $this->toolRegistry->execute('assistant', 'create_contact', [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'phone' => $phone
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'create_contact', 'toolName' => 'create_contact', 'output' => $cRes, 'result' => $cRes];
                $fullName = trim("{$firstName} {$lastName}");

                if (!empty($cRes['deduplicated'])) {
                    $reply = "Contact record for {$fullName}" . ($email ? " ({$email})" : "") . " already exists in your CRM database and has been updated.";
                } else {
                    $reply = "I have created the contact record for {$fullName}" . ($email ? " ({$email})" : "") . " in your CRM database.";
                }
                break;

            // -------------------------------------------------------------
            // CONTACT DELETE
            // -------------------------------------------------------------
            case 'CONTACT_DELETE':
                $deleteTarget = AgentRouter::extractContactDeleteTarget($userMessage);
                $deleteId = $deleteTarget['id'] ?? null;
                $deleteName = $deleteTarget['name'] ?? null;

                // If no ID or name could be extracted, check conversation history for context
                if (empty($deleteId) && empty($deleteName) && $conversation) {
                    $recentMessages = $conversation->messages()
                        ->orderBy('created_at', 'desc')
                        ->limit(6)
                        ->get();

                    foreach ($recentMessages as $msg) {
                        $meta = is_array($msg->metadata_json) ? $msg->metadata_json : (json_decode($msg->metadata_json ?? '[]', true) ?? []);
                        if (!empty($meta['toolExecuted']['output']['data'][0]['name'])) {
                            $deleteName = $meta['toolExecuted']['output']['data'][0]['name'];
                            break;
                        }
                        if (!empty($meta['toolExecuted']['output']['query'])) {
                            $q = trim($meta['toolExecuted']['output']['query']);
                            if (!empty($q) && !preg_match('/^(?:all|contacts?|leads?)$/i', $q)) {
                                $deleteName = $q;
                                break;
                            }
                        }
                    }
                }

                if (empty($deleteId) && empty($deleteName)) {
                    $reply = "Please specify which contact you'd like to delete by providing their name or ID.";
                    break;
                }

                $deleteRes = $this->toolRegistry->execute('assistant', 'delete_contact', [
                    'contact_id' => $deleteId,
                    'name' => $deleteName
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'delete_contact', 'toolName' => 'delete_contact', 'output' => $deleteRes, 'result' => $deleteRes];

                if ($deleteRes['success'] ?? false) {
                    $dName = $deleteRes['deleted_name'] ?? ($deleteName ?? 'Unknown');
                    $dId = $deleteRes['deleted_id'] ?? '';
                    $dEmail = !empty($deleteRes['deleted_email']) ? " ({$deleteRes['deleted_email']})" : '';
                    $reply = "Contact **{$dName}**{$dEmail} [ID: " . substr($dId, 0, 8) . "...] has been permanently deleted from your CRM database.";
                } else {
                    $searchLabel = $deleteName ?? $deleteId ?? 'the specified contact';
                    $reply = "I could not find a contact matching \"{$searchLabel}\" in your CRM database. No records were deleted.";
                }
                break;

            // -------------------------------------------------------------
            // CONTACT DEDUPLICATE
            // -------------------------------------------------------------
            case 'CONTACT_DEDUPLICATE':
                $targetContact = AgentRouter::extractTargetName($userMessage);
                if (empty($targetContact) && preg_match('/(?:for|of)\s+([A-Za-z\s]+)/i', $userMessage, $m)) {
                    $targetContact = trim($m[1]);
                }

                // If no target contact in current message, resolve from conversation history & prior tool results
                if (empty($targetContact) && $conversation) {
                    $recentMessages = $conversation->messages()
                        ->orderBy('id', 'desc')
                        ->limit(10)
                        ->get();

                    foreach ($recentMessages as $msg) {
                        // Check tool execution metadata from previous turns
                        $meta = is_array($msg->metadata_json) ? $msg->metadata_json : (json_decode($msg->metadata_json ?? '[]', true) ?? []);
                        if (!empty($meta['toolExecuted']['output']['query'])) {
                            $q = trim($meta['toolExecuted']['output']['query']);
                            if (!empty($q) && !preg_match('/^(?:all|contacts?|leads?)$/i', $q)) {
                                $targetContact = $q;
                                break;
                            }
                        }
                        if (!empty($meta['toolExecuted']['output']['data'][0]['name'])) {
                            $targetContact = $meta['toolExecuted']['output']['data'][0]['name'];
                            break;
                        }

                        // Check customer message for search or contact query
                        if ($msg->sender_type === 'customer' && !preg_match('/\b(duplicate|dedup|only one)\b/i', $msg->content)) {
                            $extracted = AgentRouter::extractContactSearchQuery($msg->content);
                            if (!empty($extracted) && !preg_match('/^(?:all|contacts?|leads?)$/i', $extracted)) {
                                $targetContact = $extracted;
                                break;
                            }
                            $extractedTarget = AgentRouter::extractTargetName($msg->content);
                            if (!empty($extractedTarget)) {
                                $targetContact = $extractedTarget;
                                break;
                            }
                            $creationData = AgentRouter::extractContactCreationData($msg->content);
                            if (!empty($creationData['first_name']) && $creationData['first_name'] !== 'New') {
                                $targetContact = trim("{$creationData['first_name']} {$creationData['last_name']}");
                                break;
                            }
                        }
                    }
                }

                $dedupRes = $this->toolRegistry->execute('assistant', 'deduplicate_contacts', [
                    'target_name' => $targetContact
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'deduplicate_contacts', 'toolName' => 'deduplicate_contacts', 'output' => $dedupRes, 'result' => $dedupRes];

                if (!empty($dedupRes['deleted_count']) && $dedupRes['deleted_count'] > 0) {
                    $nameLabel = !empty($dedupRes['primary_name']) ? "**{$dedupRes['primary_name']}**" : ($targetContact ? "**{$targetContact}**" : "contacts");
                    $idLabel = !empty($dedupRes['primary_id']) ? " [ID: " . substr($dedupRes['primary_id'], 0, 8) . "...]" : "";
                    $reply = "I have cleaned up duplicate records for {$nameLabel}. Removed {$dedupRes['deleted_count']} duplicate record(s) and retained primary record{$idLabel}.";
                } else {
                    $reply = $dedupRes['message'] ?? "No duplicate records found to delete.";
                }
                break;

            // -------------------------------------------------------------
            // TASK CREATE
            // -------------------------------------------------------------
            case 'TASK_CREATE':
                $targetContact = AgentRouter::extractTargetName($userMessage);
                $cleanTitle = trim(preg_replace('/^(create|add|assign|schedule)\s+(a\s+)?(task|to-?do)(\s+(to|for)\s+[A-Za-z\s]+)?/i', '', $userMessage));
                if (empty($cleanTitle) || strlen($cleanTitle) < 3) {
                    $cleanTitle = $targetContact ? "Follow up with {$targetContact}" : 'Follow up with customer';
                }
                $taskTitle = Str::limit($cleanTitle, 60);

                $res = $this->toolRegistry->execute('assistant', 'create_task', [
                    'title' => $taskTitle,
                    'contact_name' => $targetContact,
                    'priority' => str_contains($lower, 'urgent') ? 'high' : 'medium',
                    'due_days' => str_contains($lower, 'tomorrow') ? 1 : 2
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'create_task', 'toolName' => 'create_task', 'output' => $res, 'result' => $res];
                $forText = $targetContact ? " for {$targetContact}" : "";
                $reply = "I've created a new task: '{$taskTitle}'{$forText} scheduled for your team.";
                break;

            // -------------------------------------------------------------
            // OPPORTUNITY SEARCH (CONTACT SPECIFIC OR GENERAL)
            // -------------------------------------------------------------
            case 'OPPORTUNITY_SEARCH':
                $targetContact = AgentRouter::extractTargetName($userMessage);
                $oppRes = $this->toolRegistry->execute('sales', 'search_opportunities', [
                    'contact_name' => $targetContact
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'search_opportunities', 'toolName' => 'search_opportunities', 'output' => $oppRes, 'result' => $oppRes];
                $count = $oppRes['count'] ?? 0;
                $data = $oppRes['data'] ?? [];

                if ($count === 0) {
                    if ($targetContact) {
                        $reply = "No matching opportunities were found for {$targetContact} in your CRM pipeline.";
                    } else {
                        $reply = "No matching opportunities were found in your CRM pipeline.";
                    }
                } else {
                    $lines = [];
                    foreach ($data as $opp) {
                        $val = number_format((float) ($opp['value'] ?? 0), 2);
                        $stage = $opp['stage'] ?? 'Open';
                        $status = ucfirst($opp['status'] ?? 'Open');
                        $lines[] = "• **{$opp['title']}** — \${$val} | Stage: {$stage} | Status: {$status}";
                    }
                    $items = implode("\n", $lines);
                    $forStr = $targetContact ? " for {$targetContact}" : "";
                    $reply = "Found {$count} active opportunity record(s){$forStr}:\n{$items}";
                }
                break;

            // -------------------------------------------------------------
            // COMPANY LEADS / LEAD SEARCH
            // -------------------------------------------------------------
            case 'COMPANY_LEADS':
            case 'LEAD_SEARCH':
                $companyName = null;
                if (preg_match('/(?:from|for|by|in)\s+company\s+([A-Za-z0-9\s]+)/i', $userMessage, $m)) {
                    $companyName = trim($m[1]);
                } elseif (preg_match('/(?:from|for|in)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)/', $userMessage, $m)) {
                    $companyName = trim($m[1]);
                }

                // If "this company" or unspecified, inspect conversation customer company
                if (!$companyName || preg_match('/^(this|the)\s+company/i', $companyName)) {
                    $convCompany = $conversation?->customer?->company ?? null;
                    if ($convCompany) {
                        $companyName = $convCompany;
                    }
                }

                if (empty($companyName) || preg_match('/^(this|the)\s+company$/i', $companyName)) {
                    $reply = "Which company would you like me to search? Please provide the company name so I can look up its associated leads.";
                    $toolExecuted = null;
                    break;
                }

                $leadsRes = $this->toolRegistry->execute('assistant', 'search_leads', [
                    'company_name' => $companyName
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'search_leads', 'toolName' => 'search_leads', 'output' => $leadsRes, 'result' => $leadsRes];
                $count = $leadsRes['count'] ?? 0;
                $data = $leadsRes['data'] ?? [];

                if ($count === 0) {
                    $reply = "No leads were found for \"{$companyName}\" in your database.";
                } else {
                    $leadLines = [];
                    foreach ($data as $l) {
                        $info = $l['name'];
                        if (!empty($l['email'])) $info .= " ({$l['email']})";
                        if (!empty($l['status'])) $info .= " - [{$l['status']}]";
                        $leadLines[] = "• " . $info;
                    }
                    $items = implode("\n", $leadLines);
                    $reply = "Found {$count} lead(s) associated with **{$companyName}**:\n{$items}";
                }
                break;

            // -------------------------------------------------------------
            // CONVERSATION SUMMARY
            // -------------------------------------------------------------
            case 'CONVERSATION_SUMMARY':
                if (!$conversation) {
                    $reply = "Which customer or conversation would you like me to summarize? Please specify the customer name or open the conversation in your CRM.";
                    $toolExecuted = null;
                    break;
                }

                $summaryRes = $this->toolRegistry->execute('assistant', 'summarize_conversation', [
                    'conversation_id' => $conversation->id
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'summarize_conversation', 'toolName' => 'summarize_conversation', 'output' => $summaryRes, 'result' => $summaryRes];
                $reply = $summaryRes['summary'] ?? "No conversation messages available to summarize.";
                break;

            // -------------------------------------------------------------
            // APPOINTMENT AVAILABILITY
            // -------------------------------------------------------------
            case 'APPOINTMENT_AVAILABILITY':
                $targetDate = now()->addDay()->format('Y-m-d');
                if (preg_match('/(\d{4}-\d{2}-\d{2})/', $userMessage, $m)) {
                    $targetDate = $m[1];
                }
                $avail = $this->toolRegistry->execute('appointment', 'get_calendar_availability', [
                    'date' => $targetDate
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'get_calendar_availability', 'toolName' => 'get_calendar_availability', 'output' => $avail, 'result' => $avail];
                $slots = implode(', ', $avail['available_slots'] ?? []);
                if (!empty($slots)) {
                    $reply = "Available appointment openings for {$targetDate} are: {$slots}. Which time would you prefer?";
                } else {
                    $reply = "There are no open appointment slots available on {$targetDate}. Please choose an alternative date.";
                }
                break;

            // -------------------------------------------------------------
            // APPOINTMENT BOOK
            // -------------------------------------------------------------
            case 'APPOINTMENT_BOOK':
                $fallbackClient = $conversation?->customer?->name;
                $aptData = AgentRouter::extractAppointmentData($userMessage, $fallbackClient);
                $clientName = $aptData['customer_name'];
                $bookDate = $aptData['date'];
                $bookTime = $aptData['time'];
                $title = $aptData['title'];

                $aptRes = $this->toolRegistry->execute('appointment', 'create_appointment', [
                    'title' => $title,
                    'customer_name' => $clientName,
                    'date' => $bookDate,
                    'time' => $bookTime,
                    'service' => 'Product Demo'
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'create_appointment', 'toolName' => 'create_appointment', 'output' => $aptRes, 'result' => $aptRes];
                $reply = "Your appointment has been confirmed for {$bookDate} at {$bookTime} with **{$clientName}**.";
                break;

            // -------------------------------------------------------------
            // APPOINTMENT SEARCH / UPCOMING MEETINGS
            // -------------------------------------------------------------
            case 'APPOINTMENT_SEARCH':
                $searchRes = $this->toolRegistry->execute('appointment', 'search_appointments', [], $conversation, $orgId);

                $toolExecuted = [
                    'name' => 'search_appointments',
                    'toolName' => 'search_appointments',
                    'output' => $searchRes,
                    'result' => $searchRes
                ];

                $count = $searchRes['count'] ?? 0;
                $data = $searchRes['data'] ?? [];

                if ($count === 0) {
                    $reply = "You have no upcoming meetings or appointments scheduled in your calendar.";
                } else {
                    $list = [];
                    foreach ($data as $a) {
                        $cName = $a['customer_name'] ?? 'Client';
                        $d = $a['date'] ?? 'TBD';
                        $t = $a['time'] ?? '';
                        $status = $a['status'] ?? 'Confirmed';
                        $id = !empty($a['id']) ? " [ID: " . substr($a['id'], 0, 8) . "...]" : "";
                        $list[] = "• **{$a['title']}** ({$cName}) on {$d} at {$t} [{$status}]{$id}";
                    }
                    $items = implode("\n", $list);
                    $reply = "Found {$count} upcoming meeting(s) in your CRM:\n{$items}";
                }
                break;

            // -------------------------------------------------------------
            // TASK CREATE
            // -------------------------------------------------------------
            case 'TASK_CREATE':
                $title = trim(preg_replace('/^(?:can\s+you\s+)?(?:please\s+)?(?:create|add|schedule|assign|set\s+up)\s+(?:a\s+)?(?:task|to-?do)(?:\s+to)?\s+/i', '', $userMessage));
                if (empty($title)) {
                    $title = 'Follow-up Task';
                }

                $taskRes = $this->toolRegistry->execute('assistant', 'create_task', [
                    'title' => ucfirst($title),
                    'priority' => 'medium',
                    'due_days' => 1
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'create_task', 'toolName' => 'create_task', 'output' => $taskRes, 'result' => $taskRes];
                $reply = "I've created the task: **{$title}** (Priority: Medium, Due in 1 day).";
                break;

            // -------------------------------------------------------------
            // TASK SEARCH
            // -------------------------------------------------------------
            case 'TASK_SEARCH':
                $tasks = Task::where('organization_id', $orgId)
                    ->where('status', '!=', 'completed')
                    ->orderBy('created_at', 'desc')
                    ->take(15)
                    ->get();

                $toolExecuted = [
                    'name' => 'search_tasks',
                    'toolName' => 'search_tasks',
                    'output' => ['count' => $tasks->count(), 'data' => $tasks],
                    'result' => ['count' => $tasks->count(), 'data' => $tasks]
                ];

                if ($tasks->isEmpty()) {
                    $reply = "You currently have no pending tasks in your CRM.";
                } else {
                    $list = [];
                    foreach ($tasks as $t) {
                        $p = ucfirst($t->priority ?? 'medium');
                        $st = ucfirst($t->status ?? 'pending');
                        $id = substr($t->id, 0, 8) . '...';
                        $list[] = "• **{$t->title}** [{$p} priority | {$st}] [ID: {$id}]";
                    }
                    $items = implode("\n", $list);
                    $reply = "You have {$tasks->count()} pending task(s):\n{$items}";
                }
                break;

            // -------------------------------------------------------------
            // TASK COMPLETE
            // -------------------------------------------------------------
            case 'TASK_COMPLETE':
                $taskId = null;
                if (preg_match('/\b(?:id[:\s]*|ID[:\s]*)\s*([a-f0-9\-]{8,36})/i', $userMessage, $m)) {
                    $taskId = trim($m[1], "]. \t");
                }
                if ($taskId) {
                    $tRes = $this->toolRegistry->execute('assistant', 'complete_task', [
                        'task_id' => $taskId
                    ], $conversation, $orgId);
                    $toolExecuted = ['name' => 'complete_task', 'toolName' => 'complete_task', 'output' => $tRes, 'result' => $tRes];
                    $reply = ($tRes['success'] ?? false) ? "Task [ID: {$taskId}] has been marked as completed." : "Could not find task with ID: {$taskId}.";
                } else {
                    $reply = "Please specify the Task ID you'd like to mark as complete.";
                }
                break;

            // -------------------------------------------------------------
            // SYSTEM CAPABILITIES & HELP
            // -------------------------------------------------------------
            case 'CAPABILITIES_QUERY':
                $reply = "Here are the core functions and tasks I can perform for you in this CRM:\n\n"
                    . "• **📇 Contact Management**: Search contacts, view full profiles/details, create contacts, update records, delete contacts permanently, deduplicate entries, and count total contacts.\n"
                    . "• **📅 Calendar & Meetings**: Check open availability slots, book appointments/meetings, search upcoming scheduled meetings, reschedule, and cancel bookings.\n"
                    . "• **💼 Sales Pipeline**: Search deals and opportunities, create new sales proposals, and view aggregated pipeline revenue reports.\n"
                    . "• **✅ Tasks**: Create action items and to-dos assigned to contacts, view pending tasks, and mark tasks as complete.\n"
                    . "• **🏢 Companies & Leads**: Look up company accounts, create new companies, and search qualified leads.\n"
                    . "• **📦 Orders & Support**: Look up customer order fulfillment status, search policy documentation (RAG), or hand off to a human agent.";
                break;

            // -------------------------------------------------------------
            // OPPORTUNITY CREATE & PIPELINE REPORT
            // -------------------------------------------------------------
            case 'OPPORTUNITY_CREATE':
                $title = 'Sales Deal - ' . ($conversation?->customer?->name ?? 'Prospect');
                $oppRes = $this->toolRegistry->execute('sales', 'create_opportunity', [
                    'title' => $title,
                    'value' => 2500.00
                ], $conversation, $orgId);

                $toolExecuted = ['name' => 'create_opportunity', 'toolName' => 'create_opportunity', 'output' => $oppRes, 'result' => $oppRes];
                $reply = "I've created a new sales opportunity: '{$title}' with an estimated value of $2,500.00.";
                break;

            case 'PIPELINE_REPORT':
                $report = $this->toolRegistry->execute('sales', 'pipeline_report', [], $conversation, $orgId);
                $toolExecuted = ['name' => 'pipeline_report', 'toolName' => 'pipeline_report', 'output' => $report, 'result' => $report];
                $reply = "Pipeline Summary: {$report['total_deals']} total deals with an aggregate value of $" . number_format($report['total_value'] ?? 0, 2) . " ({$report['open_deals']} open deals).";
                break;

            // -------------------------------------------------------------
            // ORDER STATUS & TRACKING
            // -------------------------------------------------------------
            case 'ORDER_STATUS':
            case 'ORDER_TRACK':
                $orderNumber = AgentRouter::extractOrderNumber($userMessage);
                if (!$orderNumber) {
                    $reply = "Please provide your order number (e.g. #12345) so I can verify its status in our store.";
                } else {
                    $orderRes = $this->toolRegistry->execute('support', 'get_order_status', [
                        'order_number' => $orderNumber
                    ], $conversation, $orgId);

                    $toolExecuted = ['name' => 'get_order_status', 'toolName' => 'get_order_status', 'output' => $orderRes, 'result' => $orderRes];

                    if ($orderRes['success'] ?? false) {
                        $st = ucfirst($orderRes['status'] ?? 'Processing');
                        $tot = number_format((float) ($orderRes['total'] ?? 0), 2);
                        $reply = "Order #{$orderNumber} is currently **{$st}**. Total: \${$tot}. Provider: {$orderRes['provider']}.";
                    } else {
                        $reply = "I checked our store for order #{$orderNumber}, but no matching order record was found.";
                    }
                }
                break;

            // -------------------------------------------------------------
            // KNOWLEDGE & POLICIES
            // -------------------------------------------------------------
            case 'KNOWLEDGE_QUERY':
                $ragResults = $this->ragService->search($orgId, $userMessage, 2);
                if (!empty($ragResults) && !empty($ragResults[0]['chunk'])) {
                    $top = $ragResults[0];
                    $reply = "According to our policy documentation ({$top['title']}):\n\n{$top['chunk']}";
                    $toolExecuted = [
                        'name' => 'search_knowledge',
                        'toolName' => 'search_knowledge',
                        'output' => ['count' => count($ragResults), 'data' => $ragResults],
                        'result' => ['count' => count($ragResults), 'data' => $ragResults]
                    ];
                } else {
                    $reply = "I searched our documentation, but could not find a specific policy matching your question. Would you like me to connect you with a specialist?";
                }
                break;

            // -------------------------------------------------------------
            // HUMAN ESCALATION
            // -------------------------------------------------------------
            case 'HUMAN_REQUEST':
                $handoff = $this->toolRegistry->execute('support', 'handoff_to_human', [], $conversation, $orgId);
                $toolExecuted = ['name' => 'handoff_to_human', 'toolName' => 'handoff_to_human', 'output' => $handoff, 'result' => $handoff];
                $reply = "I have escalated this conversation to our support team queue. A human representative will be with you shortly.";
                break;

            // -------------------------------------------------------------
            // GREETING
            // -------------------------------------------------------------
            case 'GREETING':
                $reply = "Hello! How can I assist you with your CRM contacts, deals, appointments, or tasks today?";
                break;

            // -------------------------------------------------------------
            // GENERAL CHAT / FALLBACK
            // -------------------------------------------------------------
            default:
                if (!empty($groundingContext) && $groundingContext !== 'No company knowledge base match found.') {
                    $reply = "Based on our documentation:\n\n{$groundingContext}\n\nHow else can I assist you with your business records today?";
                } else {
                    $reply = "I am your AI Business Assistant. I can search contacts, schedule meetings, create tasks, or look up orders and knowledge base policies. How may I help you?";
                }
                break;
        }

        return [
            'reply' => $reply,
            'toolExecuted' => $toolExecuted
        ];
    }

    /**
     * Invoke Gemini function calling with strict zero-hallucination prompt.
     */
    protected function callGemini(
        string $apiKey,
        string $agentType,
        string $userMessage,
        string $groundingContext,
        array $tools,
        string $orgId,
        ?Conversation $conversation,
        array $history = []
    ): ?array {
        $model = env('GEMINI_MODEL', 'gemini-1.5-flash');
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $systemPrompt = "You are a professional enterprise AI CRM assistant. You have access to real server tools. "
            . "CRITICAL INSTRUCTIONS: "
            . "1. NEVER fabricate or guess contact records, orders, appointments, or pipeline values. "
            . "2. When asked to search, check, create, or update records, YOU MUST call the appropriate function tool. "
            . "3. Never claim you performed an action unless the tool execution succeeded. "
            . "4. If a contact or order is not found, state that explicitly. "
            . "5. Grounding context: {$groundingContext}";

        $geminiTools = [
            ['functionDeclarations' => array_values($tools)]
        ];

        $payload = [
            'systemInstruction' => ['parts' => [['text' => $systemPrompt]]],
            'contents' => [['role' => 'user', 'parts' => [['text' => $userMessage]]]],
            'tools' => $geminiTools
        ];

        try {
            $verify = env('CURL_VERIFY_SSL', false);
            $res = Http::timeout(10)->withOptions(['verify' => $verify])->post($url, $payload);
            if (!$res->successful()) {
                return null;
            }

            $data = $res->json();
            $candidate = $data['candidates'][0]['content']['parts'][0] ?? null;

            if (!$candidate) return null;

            if (isset($candidate['functionCall'])) {
                $fnName = $candidate['functionCall']['name'];
                $fnArgs = $candidate['functionCall']['args'] ?? [];

                // Execute real CRM tool
                $toolResult = $this->toolRegistry->execute($agentType, $fnName, $fnArgs, $conversation, $orgId);

                // Second turn: provide tool output back to model
                $secondPayload = [
                    'systemInstruction' => ['parts' => [['text' => $systemPrompt]]],
                    'contents' => [
                        ['role' => 'user', 'parts' => [['text' => $userMessage]]],
                        ['role' => 'model', 'parts' => [['functionCall' => $candidate['functionCall']]]],
                        ['role' => 'function', 'parts' => [['functionResponse' => ['name' => $fnName, 'response' => ['output' => $toolResult]]]]]
                    ],
                    'tools' => $geminiTools
                ];

                $secondRes = Http::timeout(10)->withOptions(['verify' => $verify])->post($url, $secondPayload);
                if ($secondRes->successful()) {
                    $secondData = $secondRes->json();
                    $finalReply = $secondData['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($finalReply) {
                        return [
                            'reply' => $finalReply,
                            'toolExecuted' => ['name' => $fnName, 'toolName' => $fnName, 'output' => $toolResult, 'result' => $toolResult]
                        ];
                    }
                }

                return [
                    'reply' => "I executed the requested action ({$fnName}).",
                    'toolExecuted' => ['name' => $fnName, 'toolName' => $fnName, 'output' => $toolResult, 'result' => $toolResult]
                ];
            }
        } catch (\Throwable $e) {
            Log::debug("Gemini LLM call exception: " . $e->getMessage());
            return null;
        }

        return [
            'reply' => $candidate['text'] ?? null,
            'toolExecuted' => null
        ];
    }
}
