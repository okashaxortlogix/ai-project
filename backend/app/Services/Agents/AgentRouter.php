<?php

namespace App\Services\Agents;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Agent;
use Illuminate\Support\Facades\Log;

class AgentRouter
{
    /**
     * Determine intent and route conversation to the appropriate specialized agent.
     */
    public function route(Conversation $conversation, string $userMessage): Agent
    {
        $intent = $this->detectIntent($userMessage);
        
        Log::info("AgentRouter classified message: '{$userMessage}' as intent: '{$intent}'");

        $agentType = match ($intent) {
            'CONTACT_SEARCH', 'CONTACT_CREATE', 'CONTACT_UPDATE', 'CONTACT_DELETE', 'CONTACT_DEDUPLICATE', 'CONTACT_COUNT',
            'COMPANY_SEARCH', 'COMPANY_CREATE', 'COMPANY_LEADS', 'LEAD_SEARCH',
            'TASK_CREATE', 'TASK_COMPLETE', 'TASK_SEARCH',
            'CONVERSATION_SUMMARY', 'CAPABILITIES_QUERY',
            'ANALYTICS_QUERY' => 'assistant',
            
            'OPPORTUNITY_CREATE', 'OPPORTUNITY_SEARCH', 'PIPELINE_REPORT' => 'sales',
            
            'APPOINTMENT_AVAILABILITY', 'APPOINTMENT_BOOK', 'APPOINTMENT_SEARCH',
            'APPOINTMENT_RESCHEDULE', 'APPOINTMENT_CANCEL' => 'appointment',
            
            'ORDER_STATUS', 'ORDER_TRACK', 'ORDER_CANCEL', 'KNOWLEDGE_QUERY' => 'support',
            
            'HUMAN_REQUEST' => 'support',
            
            default => 'assistant',
        };

        // Find active organization agent of this type, or default to general assistant/support
        $agent = Agent::where('organization_id', $conversation->organization_id)
            ->where('type', $agentType)
            ->where('enabled', true)
            ->first();

        if (!$agent) {
            $agent = Agent::where('organization_id', $conversation->organization_id)
                ->where('type', 'assistant')
                ->where('enabled', true)
                ->first();
        }

        if (!$agent) {
            $agent = Agent::where('organization_id', $conversation->organization_id)
                ->where('enabled', true)
                ->first();
        }

        if (!$agent) {
            $agent = new Agent([
                'id' => "agent-{$agentType}",
                'organization_id' => $conversation->organization_id,
                'name' => ucfirst($agentType) . ' Agent',
                'type' => $agentType,
                'role' => "Autonomous {$agentType} agent",
                'enabled' => true,
                'temperature' => 0.3
            ]);
        }

        if ($agent->exists) {
            $conversation->update(['active_agent_id' => $agent->id]);
        }

        return $agent;
    }

    /**
     * Structured intent classifier using deterministic matching.
     */
    public function detectIntent(string $text): string
    {
        $lower = strtolower(trim($text));

        // 1. Explicit human handoff request
        if (preg_match('/\b(human|agent|representative|operator|talk to person|real person|escalate)\b/', $lower)) {
            return 'HUMAN_REQUEST';
        }

        // 1b. Capabilities & System Help Intent
        if (preg_match('/^(?:what\s+(?:tasks|functions|actions|things|features|services)?\s*can\s+you\s+(?:perform|do)|what\s+do\s+you\s+do|what\s+are\s+your\s+(?:capabilities|features|functions)|what\s+can\s+this\s+(?:crm|assistant|system)\s+do|help|how\s+can\s+you\s+help(?:\s+me)?)\b/i', $lower)) {
            return 'CAPABILITIES_QUERY';
        }

        // 2. Greeting / Politeness check (strict full phrase or isolated greeting)
        if (preg_match('/^(hello|hi|hey|good\s+(morning|afternoon|evening)|greetings|howdy)[\s\!\.\?]*$/i', $lower)) {
            return 'GREETING';
        }

        // 3. Contact Deduplication / Cleanup ("delete the duplicates, leave only one", "deduplicate contacts")
        if (preg_match('/\b(delete|remove|clean|purge|drop|merge)\b.*\b(duplicates?|clones?)\b/i', $lower) ||
            preg_match('/\b(deduplicate|dedup)\b/i', $lower) ||
            preg_match('/\b(leave|keep)\s+only\s+one\b/i', $lower)) {
            return 'CONTACT_DEDUPLICATE';
        }

        // 4. Conversation Summary
        if (preg_match('/\b(summariz(e|ation)|summary|recap)\b.*\b(conversation|chat|messages?|history|customer)\b/i', $lower) ||
            preg_match('/^summarize\s+(this|the|customer\'?s?)\s+conversation/i', $lower)) {
            return 'CONVERSATION_SUMMARY';
        }

        // 4. Opportunities / Deals / Pipeline Intent (Must evaluate before generic contact create)
        if (preg_match('/\b(deals?|opportunit(y|ies)|pipeline|proposals?|quotes?)\b/', $lower)) {
            if (preg_match('/\b(report|stats|summary|metrics|revenue)\b/', $lower)) {
                return 'PIPELINE_REPORT';
            }
            if (preg_match('/\b(create|new|add|open)\b/', $lower)) {
                return 'OPPORTUNITY_CREATE';
            }
            return 'OPPORTUNITY_SEARCH';
        }

        // 5. Company Leads / Lead Search
        if (preg_match('/\b(leads?|prospects?)\b.*\b(from\s+this\s+company|for\s+this\s+company|from\s+company|by\s+company)\b/i', $lower) ||
            preg_match('/^find\s+all\s+leads\s+(from|for|in)\s+/i', $lower)) {
            return 'COMPANY_LEADS';
        }

        // 6. Appointments & Scheduling Intent (Handles slots, availability, booking, search)
        if (preg_match('/\b(appointments?|meetings?|demo|consultations?|schedule|calendar|slots?|openings?|availability)\b/', $lower) ||
            preg_match('/\b(book\s+(?:one|a\s+slot|a\s+meeting|an\s+appointment)|schedule\s+(?:one|a\s+meeting|an\s+appointment))\b/', $lower)) {
            if (preg_match('/\b(cancel|drop|delete)\b/', $lower)) {
                return 'APPOINTMENT_CANCEL';
            }
            if (preg_match('/\b(reschedule|change|move|postpone)\b/', $lower)) {
                return 'APPOINTMENT_RESCHEDULE';
            }
            // Upcoming / list / search appointments
            if (preg_match('/\b(show|display|list|view|check|get|find|see|upcoming|all|existing|what\s+meetings|what\s+appointments|do\s+i\s+have)\b/i', $lower) &&
                !preg_match('/\b(book|reserve|create|new|schedule\s+(?:a|an|one))\b/i', $lower)) {
                return 'APPOINTMENT_SEARCH';
            }
            if (preg_match('/\b(available|slots?|openings?|free|times?|when)\b/', $lower) && !preg_match('/\b(book|reserve|schedule|create)\b/', $lower)) {
                return 'APPOINTMENT_AVAILABILITY';
            }
            return 'APPOINTMENT_BOOK';
        }

        // 7. Tasks Intent
        if (preg_match('/\b(tasks?|to-?do)\b/', $lower)) {
            if (preg_match('/\b(create|add|assign|schedule|new)\b/', $lower)) {
                return 'TASK_CREATE';
            }
            if (preg_match('/\b(complete|finish|done|close)\b/', $lower)) {
                return 'TASK_COMPLETE';
            }
            return 'TASK_SEARCH';
        }

        // 8. Companies Intent
        if (preg_match('/\b(compan(y|ies)|organizations?|accounts?)\b/', $lower)) {
            if (preg_match('/\b(create|add|new|register)\b/', $lower)) {
                return 'COMPANY_CREATE';
            }
            return 'COMPANY_SEARCH';
        }

        // 9. Contact Intent Detection
        if (preg_match('/\b(contacts?|leads?)\b/', $lower)) {
            // First check count / statistics queries BEFORE action verbs
            if (preg_match('/\b(how many|count|number of|total|stats|statistics)\b/', $lower)) {
                return 'CONTACT_COUNT';
            }
            // Delete/remove a specific contact (not duplicates — that's handled above)
            if (preg_match('/\b(delete|remove|erase|destroy|get rid of)\b/', $lower) && !preg_match('/\b(duplicates?|clones?|tag)\b/i', $lower)) {
                return 'CONTACT_DELETE';
            }
            if (preg_match('/\b(create|add|new|register)\b/', $lower) || preg_match('/\bsave\s+(?:a\s+)?(?:new\s+)?(?:contact|lead)\b/', $lower)) {
                return 'CONTACT_CREATE';
            }
            if (preg_match('/\b(update|edit|tag|add tag|remove tag)\b/', $lower)) {
                return 'CONTACT_UPDATE';
            }
            return 'CONTACT_SEARCH';
        }

        // Alternate contact delete queries without "contact" keyword (e.g., "delete Muhammad Okasha", "remove user ID a2bf...")
        if (preg_match('/^(?:can you\s+)?(?:please\s+)?(?:delete|remove|erase|destroy|get rid of)\s+(?:the\s+)?(?:user|record|entry|person)?\s*(?:named\s+)?/i', $lower) &&
            !preg_match('/\b(duplicates?|clones?|order|appointment|task|deal|tag)\b/', $lower)) {
            return 'CONTACT_DELETE';
        }

        // Details / info / profile queries for a contact (e.g., "display details of Ahsan Shah", "details for Ahsan Shah", "who is Ahsan Shah")
        if (preg_match('/^(?:can\s+you\s+)?(?:please\s+)?(?:display|show|view|get|fetch|pull\s+up|give\s+me|see)?\s*(?:the\s+)?(?:details?|info|information|profile|record|data)\s+(?:of|for|on|about)\s+([a-zA-Z0-9\.\-\_\s]+)/i', $lower) &&
            !preg_match('/\b(order|tracking|package|appointment|meeting|slot|opportunity|deal|pipeline)\b/', $lower)) {
            return 'CONTACT_SEARCH';
        }

        if (preg_match('/^(?:who\s+is|who\'?s|tell\s+me\s+about)\s+([a-zA-Z0-9\.\-\_\s]+)/i', $lower) &&
            !preg_match('/\b(order|tracking|package|appointment|meeting|slot|opportunity|deal|pipeline)\b/', $lower)) {
            return 'CONTACT_SEARCH';
        }

        // Alternate contact search queries (e.g., "check for Muhammad Okasha", "find John XYZ in database", "display/show Ahsan Shah")
        if (preg_match('/^(?:can\s+you\s+)?(?:please\s+)?(?:check\s+for|look\s*up|find|search\s+for|show|display|view|pull\s+up)\s+([a-zA-Z0-9\.\-\_\s]+)/i', $lower) && 
            !preg_match('/\b(order|tracking|package|appointment|meeting|slot|opportunity|deal|pipeline|report|stats|task|tasks|compan(y|ies)|leads?)\b/', $lower)) {
            return 'CONTACT_SEARCH';
        }

        // 10. Orders & eCommerce Intent
        if (preg_match('/\b(orders?|track|tracking|package|shipment|delivery|fulfillment|courier)\b/', $lower)) {
            if (preg_match('/\b(cancel|refund|return)\b/', $lower)) {
                return 'ORDER_CANCEL';
            }
            if (preg_match('/\b(track|where is|status|estimated)\b/', $lower)) {
                return 'ORDER_STATUS';
            }
            return 'ORDER_STATUS';
        }

        // 11. Knowledge & Policy Intent
        if (preg_match('/\b(policy|policies|guidelines?|terms|conditions|sops?|documentation|faq|manual|rules?)\b/', $lower)) {
            return 'KNOWLEDGE_QUERY';
        }

        // 12. General Analytics
        if (preg_match('/\b(metrics|analytics|kpis|conversion rate|response time|performance)\b/', $lower)) {
            return 'ANALYTICS_QUERY';
        }

        return 'GENERAL_CHAT';
    }

    /**
     * Splits compound queries into multiple sub-intents if present.
     * E.g. "What opportunities does Muhammad Okasha have? Create a task for Muhammad Okasha."
     * Returns array of ['intent' => string, 'query' => string]
     */
    public function detectMultiIntents(string $text): array
    {
        $rawClauses = preg_split('/(\?|\;|\.\s+(?=[A-Z]))/u', trim($text), -1, PREG_SPLIT_NO_EMPTY);
        $clauses = array_values(array_filter(array_map('trim', $rawClauses), fn($c) => strlen($c) > 3));

        if (count($clauses) <= 1) {
            return [];
        }

        $detected = [];
        foreach ($clauses as $clause) {
            $intent = $this->detectIntent($clause);
            if ($intent !== 'GENERAL_CHAT' && $intent !== 'GREETING') {
                $detected[] = [
                    'intent' => $intent,
                    'query' => $clause
                ];
            }
        }

        return count($detected) >= 2 ? $detected : [];
    }

    /**
     * Clean entity extraction for contact search.
     * Handles "Display all the contacts", "Show all contacts", "check for contact name Muhammad Okasha", etc.
     */
    public static function extractContactSearchQuery(string $text): string
    {
        $clean = trim($text);

        // 0. Universal match for requests wanting all/every contact or directory listing
        if (preg_match('/^(?:can\s+you\s+)?(?:please\s+)?(?:show(?:\s+me)?|display|list|get|fetch|see|view|find|search(?:\s+for)?|check(?:\s+for)?)?\s*(?:all|every|the|my|our|current|latest|recent|new|updated)?\s*(?:of\s+(?:the|my)\s+)?(?:contacts?|leads?|customers?|people|persons?|records?)?(?:\s+(?:list|directory|roster|table))?(?:\s+(?:in|from|within)\s+(?:the\s+)?(?:database|db|crm|system|directory|contacts?))?[\s\?\.]*$/i', $clean) ||
            preg_match('/^(?:show\s+all|list\s+all|view\s+all|display\s+all|search\s+(?:for\s+)?all|check\s+(?:for\s+)?all|all\s+contacts?|all\s+the\s+contacts?|updated\s+contacts?|updated\s+contact\s+list|contact\s+list|contacts\s+list)(?:\s+(?:in|from|within)\s+(?:the\s+)?(?:database|db|crm|system))?[\s\?\.]*$/i', $clean)) {
            return '';
        }

        // 1. Remove leading conversational and action preambles
        $clean = preg_replace('/^(?:can\s+you\s+)?(?:please\s+)?(?:check\s+(?:for\s+)?|find\s+|search\s+(?:for\s+)?|lookup\s+|look\s+up\s+|show\s+(?:me\s+)?|get\s+|fetch\s+|display\s+|list\s+|see\s+|view\s+|pull\s+up\s+|open\s+|is\s+there\s+(?:a\s+)?)/i', '', $clean);

        // 1b. Remove details / profile / info / inquiry phrases
        $clean = preg_replace('/^(?:who\s+is|who\'?s|tell\s+me\s+about)\s+/i', '', trim($clean));
        $clean = preg_replace('/^(?:the\s+)?(?:contact\s+)?(?:details?|info|information|profile|record|data)\s+(?:of|for|on|about)\s+/i', '', trim($clean));
        $clean = preg_replace('/^(?:details?|info|information|profile|record|data)\s+(?:of|for|on|about)\s+(?:contact\s+)?/i', '', trim($clean));

        // 2. Strip leading nouns, determiners, and qualifiers (e.g. "all the contacts", "the contact", "contacts")
        $clean = preg_replace('/^(?:all\s+)?(?:(?:of\s+)?(?:the|my)\s+)?(?:a\s+)?(?:contacts?|leads?|people|persons?|customers?|records?)\s+/i', '', trim($clean));

        // 2b. Repeat details stripping in case contact was stripped first
        $clean = preg_replace('/^(?:the\s+)?(?:details?|info|information|profile|record|data)\s+(?:of|for|on|about)\s+/i', '', trim($clean));

        // 3. Strip naming connectors like "named", "name", "called", "with name", "with the name of", "name is", "whose name is"
        $clean = preg_replace('/^(?:named|name|called|with\s+(?:the\s+)?name(?:\s+of)?|whose\s+name\s+is|name(?:\s+is)?)\s+/i', '', trim($clean));

        // 4. In case "contact named", "contact name", "contacts named" was phrased together
        $clean = preg_replace('/^(?:(?:a\s+)?contacts?|leads?|person)\s+(?:named|name|called)\s+/i', '', trim($clean));

        // 5. Remove trailing or dangling scope phrases (e.g., "in contacts", "in the crm", "in the database", "from contacts")
        $clean = preg_replace('/(?:\s*|^)(?:in|from|within)\s+(?:the\s+)?(?:contacts?|crm|database|db|system|leads?|records?)[\s\?\.]*$/i', '', $clean);

        // 6. Strip punctuation and surrounding whitespace
        $clean = trim(trim($clean), "?!.,;\"' ");

        // 7. If after stripping the remaining string is purely generic, return empty string for full list
        if (preg_match('/^(?:all|every|the|my|our|current|latest|recent|new|updated)?\s*(?:(?:of\s+)?(?:the|my)\s+)?(?:contacts?|leads?|customers?|records?|people)?(?:\s+(?:list|directory|roster|table))?(?:\s+(?:in|from|within)\s+(?:the\s+)?(?:database|db|crm|system))?$/i', $clean)) {
            return '';
        }

        return $clean;
    }

    /**
     * Hardened contact creation entity extraction.
     * Accurately parses first_name, last_name, email, and phone.
     * Handles attributes like age, notes, commas, compound names, and conversational phrasing.
     */
    public static function extractContactCreationData(string $text): array
    {
        $email = null;
        $phone = null;

        // Extract email if present
        if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $em)) {
            $email = $em[0];
        }

        // Extract phone if present
        if (preg_match('/(?:\+?[0-9]{1,3}[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/', $text, $ph)) {
            $phone = $ph[0];
        }

        // Remove email and phone from text before name parsing
        $clean = $text;
        if ($email) {
            $clean = str_replace($email, '', $clean);
        }
        if ($phone) {
            $clean = str_replace($phone, '', $clean);
        }

        // Strip noise markers (e.g. "with email", "and phone")
        $clean = preg_replace('/\b(with|and)?\s*(email|phone|mobile|tel|contact info|details)(?:\s*(?:is|:))?/i', '', $clean);

        // Strip age markers in all conversational forms:
        // e.g. "and his age is 24", "and her age is 24", "and age is 24", ", age 24", "age: 24", "who is 24 years old", "24 years old"
        $clean = preg_replace('/(?:,\s*)?(?:and\s+)?(?:his|her|their)?\s*\b(?:age\s+(?:is|=|:)?|aged|who\s+is)\s*\d+(?:\s*years?(?:\s*old)?)?/i', '', $clean);
        $clean = preg_replace('/(?:,\s*)?\b\d+\s*years?(?:\s*old)?/i', '', $clean);
        $clean = preg_replace('/,?\s*\b(?:notes?|remarks?|memo|details?|info)\b[\s:=].*$/i', '', $clean);

        // If explicit self-introduction or name identification is present (e.g. "My name is Sarah Connor")
        if (preg_match('/(?:my\s+name\s+is|name\s+is|i\s+am)\s+([A-Za-z\s]+)/i', $clean, $nm)) {
            $clean = $nm[1];
        } else {
            // Strip creation command preambles: e.g. "create a contact name Muhammad Okasha", "add a contact named..."
            $clean = preg_replace('/^(?:please\s+)?(?:create|add|new|register|save|insert)\s+(?:a\s+)?(?:contact|lead|person|customer|entry)?(?:\s+(?:named|name|for|called|with\s+(?:the\s+)?name(?:\s+of)?))?\s*/i', '', trim($clean));

            // Strip any residual "named", "name", or "called"
            $clean = preg_replace('/^(?:named|name|called|with\s+name|whose\s+name\s+is)\s+/i', '', trim($clean));
        }

        // If there is a comma separating the person's name from extra information, extract the name portion
        if (str_contains($clean, ',')) {
            $partsByComma = explode(',', $clean, 2);
            $candidate = trim($partsByComma[0]);
            if (!empty($candidate)) {
                $clean = $candidate;
            }
        }

        // Strip punctuation and surrounding whitespace
        $clean = trim($clean, " \t\n\r\0\x0B.!?,;:'\"");

        $parts = preg_split('/\s+/', trim($clean));
        $parts = array_values(array_filter($parts, fn($p) => !empty($p)));

        if (count($parts) === 0) {
            return [
                'first_name' => 'New',
                'last_name' => 'Contact',
                'email' => $email,
                'phone' => $phone
            ];
        } elseif (count($parts) === 1) {
            return [
                'first_name' => $parts[0],
                'last_name' => '',
                'email' => $email,
                'phone' => $phone
            ];
        } elseif (count($parts) === 2) {
            return [
                'first_name' => $parts[0],
                'last_name' => $parts[1],
                'email' => $email,
                'phone' => $phone
            ];
        } else {
            // Compound name (3+ words), e.g. "Muhammad Ali Khan"
            $last = array_pop($parts);
            $first = implode(' ', $parts);
            return [
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'phone' => $phone
            ];
        }
    }

    /**
     * Extracts subject/target name from inquiries or tasks.
     * E.g. "What opportunities does Muhammad Okasha have?" => "Muhammad Okasha"
     * E.g. "Create a task for Muhammad Okasha" => "Muhammad Okasha"
     */
    public static function extractTargetName(string $text): ?string
    {
        if (preg_match('/(?:for|does|of|belonging\s+to|assigned\s+to)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/', $text, $m)) {
            return trim($m[1]);
        }
        if (preg_match('/(?:for|does|of|belonging\s+to|assigned\s+to)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)+)(?:\s+have|\s*\?|$)/i', $text, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    /**
     * Clean order identifier extraction.
     * E.g. "Where is my order #12345?" => "12345"
     */
    /**
     * Extract the target contact for a deletion request.
     * Returns ['id' => string|null, 'name' => string|null]
     *
     * Handles:
     *  - "Delete contact Muhammad Okasha"
     *  - "Remove the user with ID a2bf2b7c..."
     *  - "Delete the contact [ID: a2bf2b7c...]"
     */
    public static function extractContactDeleteTarget(string $text): array
    {
        $id = null;
        $name = null;

        // Extract UUID-style ID if present (full or partial)
        if (preg_match('/\b(?:id[:\s]*|ID[:\s]*)\s*([a-f0-9\-]{8,36})/i', $text, $m)) {
            $id = trim($m[1], "]. \t");
        } elseif (preg_match('/\[(?:ID:\s*)?([a-f0-9\-]{8,36})\.{0,3}\]/', $text, $m)) {
            $id = trim($m[1]);
        }

        // Extract name
        $clean = $text;
        // Strip command preambles
        $clean = preg_replace('/^(?:can you\s+)?(?:please\s+)?(?:delete|remove|erase|destroy|get rid of)\s+/i', '', trim($clean));
        // Strip "the contact", "contact named", etc.
        $clean = preg_replace('/^(?:the\s+)?(?:contact|user|record|entry|person|lead|customer)\s+/i', '', trim($clean));
        $clean = preg_replace('/^(?:named|name|called|with\s+(?:the\s+)?name(?:\s+of)?)\s+/i', '', trim($clean));
        // Strip ID suffix
        $clean = preg_replace('/\s*\[.*\]\s*$/', '', $clean);
        $clean = preg_replace('/\s*(?:with\s+)?(?:id|ID)[:\s]+[a-f0-9\-]+\.{0,3}\s*$/i', '', $clean);
        // Strip trailing scope phrases
        $clean = preg_replace('/\s+(?:from|in|within)\s+(?:the\s+)?(?:contacts?|crm|database|db|system)[\s\?\.]*$/i', '', $clean);
        $clean = trim($clean, " \t\n\r\0\x0B.!?,;:'\"");

        if (!empty($clean) && !preg_match('/^(?:contacts?|leads?|records?|all|the)$/i', $clean)) {
            $name = $clean;
        }

        return ['id' => $id, 'name' => $name];
    }

    public static function extractOrderNumber(string $text): ?string
    {
        if (preg_match('/#?([0-9]{3,12})/i', $text, $matches)) {
            return $matches[1];
        }
        if (preg_match('/order\s+(?:id\s+|number\s+|#)?([a-zA-Z0-9_-]+)/i', $text, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Accurate appointment entity extraction for booking.
     * Extracts customer_name, date (handling relative days and month names), time, and title.
     */
    public static function extractAppointmentData(string $text, ?string $fallback = null): array
    {
        // 1. Client Name extraction
        $clientName = null;
        if (preg_match('/\bwith\s+([A-Z][a-zA-Z0-9\.\-\_]+(?:\s+[A-Z][a-zA-Z0-9\.\-\_]+)*)/u', $text, $m)) {
            $clientName = trim($m[1]);
        } elseif (preg_match('/\bwith\s+([a-zA-Z0-9\.\-\_\s]+?)(?:\s+(?:for|at|on|tomorrow|today|this|next|\d{4})|$|\.)/i', $text, $m)) {
            $candidate = trim($m[1]);
            if (!preg_match('/^(?:a|an|the)\s+(?:demo|consultation|meeting)/i', $candidate)) {
                $clientName = $candidate;
            }
        }
        
        if (!$clientName && preg_match('/\bfor\s+([A-Z][a-zA-Z0-9\.\-\_]+(?:\s+[A-Z][a-zA-Z0-9\.\-\_]+)*)/u', $text, $m)) {
            $candidate = trim($m[1]);
            if (!preg_match('/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|the\s+|next\s+|this\s+|a\s+|an\s+)/i', $candidate)) {
                $clientName = $candidate;
            }
        }

        if (!$clientName) {
            $clientName = $fallback ?: 'Guest Client';
        }

        // 2. Date extraction
        $date = null;
        if (preg_match('/(\d{4}-\d{2}-\d{2})/', $text, $m)) {
            $date = $m[1];
        } elseif (preg_match('/(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4})/i', $text, $m)) {
            $cleanDateStr = preg_replace('/(\d+)(?:st|nd|rd|th)/', '$1', $m[1]);
            $date = date('Y-m-d', strtotime($cleanDateStr));
        } elseif (preg_match('/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/i', $text, $m)) {
            $cleanDateStr = preg_replace('/(\d+)(?:st|nd|rd|th)/', '$1', $m[1]);
            $date = date('Y-m-d', strtotime($cleanDateStr));
        } elseif (preg_match('/\b(?:for\s+the\s+|on\s+the\s+|the\s+|this\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i', $text, $m)) {
            $dayName = strtolower($m[1]);
            $date = date('Y-m-d', strtotime("next {$dayName}"));
        } elseif (preg_match('/\btomorrow\b/i', $text)) {
            $date = date('Y-m-d', strtotime('+1 day'));
        } elseif (preg_match('/\btoday\b/i', $text)) {
            $date = date('Y-m-d');
        } else {
            $date = date('Y-m-d', strtotime('+1 day'));
        }

        // 3. Time extraction
        $time = '10:00 AM';
        if (preg_match('/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i', $text, $m)) {
            $timeStr = trim($m[1]);
            if (!str_contains($timeStr, ':')) {
                $timeStr = preg_replace('/^(\d{1,2})\s*(am|pm)$/i', '$1:00 $2', $timeStr);
            }
            $time = strtoupper($timeStr);
        } elseif (preg_match('/\bat\s+(\d{1,2})\b/i', $text, $m)) {
            $hr = (int) $m[1];
            $meridiem = ($hr >= 9 && $hr <= 11) ? 'AM' : 'PM';
            $time = sprintf('%02d:00 %s', $hr, $meridiem);
        }

        return [
            'customer_name' => $clientName,
            'date' => $date,
            'time' => $time,
            'title' => "Meeting with {$clientName}"
        ];
    }
}
