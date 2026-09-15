# AI Intent Coverage & Routing Matrix

This matrix documents all 22+ deterministic intents, their assigned agents, associated tools, entity extraction patterns, and zero-hallucination fallback policies.

| Intent Code | User Query Pattern Examples | Assigned Agent | Bound Tool(s) | Entity Extraction | Expected Output / Behavior |
|-------------|-----------------------------|----------------|---------------|-------------------|----------------------------|
| `GREETING` | • "hello"<br>• "hi"<br>• "good morning" | `assistant` | *None* | *None* | Friendly greeting acknowledging capabilities; zero tool execution. |
| `CONTACT_SEARCH` | • "Find Muhammad Okasha in contacts"<br>• "can you check for Sarah in contacts?" | `assistant` | `search_contacts` | `extractContactSearchQuery()` | Returns all matching records with details; if none found, explicitly declares zero matches. |
| `CONTACT_CREATE` | • "Create a contact named Ali Khan"<br>• "Add lead Ahmed Raza with email..." | `assistant` | `create_contact` | `extractContactCreationData()` | Extracts exact `first_name`, `last_name`, `email`, `phone`. Deduplicates if email exists. |
| `CONTACT_UPDATE` | • "tag Muhammad Okasha with VIP"<br>• "update contact status" | `assistant` | `update_contact`, `add_tag` | `extractTargetName()` | Updates contact attributes or attaches tag. |
| `OPPORTUNITY_SEARCH` | • "What opportunities does Muhammad Okasha have?"<br>• "show deals for Ali Khan" | `sales` | `search_opportunities` | `extractTargetName()` | Queries deals for specific contact; returns deal title, stage, value, status. Never creates deals. |
| `OPPORTUNITY_CREATE` | • "create deal for Acme Corp"<br>• "new opportunity for lead" | `sales` | `create_opportunity` | Deal title, value | Persists new opportunity in CRM pipeline. |
| `PIPELINE_REPORT` | • "pipeline report"<br>• "give me revenue metrics" | `sales` | `pipeline_report` | *None* | Returns aggregate deal counts, won value, and open deals. |
| `COMPANY_SEARCH` | • "search company Acme Corp"<br>• "find organization Globex" | `assistant` | `search_companies` | Company name | Returns matching company records. |
| `COMPANY_CREATE` | • "create company Acme Corp" | `assistant` | `create_company` | Company name, domain | Persists company record in database. |
| `COMPANY_LEADS` | • "Find all leads from this company"<br>• "leads from Acme Corp" | `assistant` | `search_leads` | Company name / Conversation context | If company is missing, prompts: *"Which company would you like me to search?"*. If found, returns leads. |
| `LEAD_SEARCH` | • "search hot leads"<br>• "show new prospects" | `assistant` | `search_leads` | Status filter | Returns leads matching status. |
| `TASK_CREATE` | • "Create a task for Muhammad Okasha"<br>• "add urgent task to follow up" | `assistant` | `create_task` | `extractTargetName()`, priority, due days | Resolves contact name to contact ID; schedules task in database. |
| `TASK_COMPLETE` | • "complete task #12"<br>• "mark task done" | `assistant` | `complete_task` | Task ID | Marks task completed in database. |
| `TASK_SEARCH` | • "show my pending tasks"<br>• "list tasks" | `assistant` | `search_tasks` | Status | Returns matching tasks. |
| `APPOINTMENT_AVAILABILITY` | • "What slots are available tomorrow?"<br>• "when is the next opening?" | `appointment` | `get_calendar_availability` | Date (YYYY-MM-DD) | Returns unbooked time slots from SQLite appointments table. |
| `APPOINTMENT_BOOK` | • "Book appointment tomorrow at 10 AM for Jane Doe" | `appointment` | `create_appointment` | Name, Date, Time | Auto-resolves customer ID; creates confirmed appointment. |
| `APPOINTMENT_RESCHEDULE` | • "reschedule appointment #45 to Friday" | `appointment` | `reschedule_appointment` | Appointment ID, new time | Updates appointment timestamp. |
| `APPOINTMENT_CANCEL` | • "cancel my appointment tomorrow" | `appointment` | `cancel_appointment` | Appointment ID | Sets appointment status to Cancelled. |
| `CONVERSATION_SUMMARY` | • "Summarize this customer's conversation"<br>• "recap chat history" | `assistant` | `summarize_conversation` | `conversation_id` | If no conversation active, prompts user to select one. If active, summarizes real transcript factually. |
| `ORDER_STATUS` | • "Where is my order #12345?"<br>• "track order #67890" | `support` | `get_order_status` | `extractOrderNumber()` | Checks WooCommerce/Shopify store; reports status or truthful not found. |
| `ORDER_CANCEL` | • "cancel order #12345" | `support` | `cancel_order` | `extractOrderNumber()` | Initiates cancellation workflow. |
| `KNOWLEDGE_QUERY` | • "What is our cancellation policy?"<br>• "show SOP guidelines" | `support` | `search_knowledge` | Keyword chunks | Grounded in RAG vector chunks. Returns citations or honest not-found. |
| `HUMAN_REQUEST` | • "transfer to a human agent"<br>• "talk to real person" | `support` | `handoff_to_human` | *None* | Escalates conversation status to waiting_for_human. |
| `MULTI_INTENT` | • "What opportunities does Muhammad Okasha have? Create a task for Muhammad Okasha." | Dynamic Composite | Sequential Tools | Sub-clause intent detection | Splits compound requests; executes all sub-intents sequentially with zero unrequested actions. |
| `GENERAL_CHAT` | • "Tell me about business software" | `assistant` | Grounding / RAG | *None* | Fallback only for genuinely unsupported or informational inquiries. |
