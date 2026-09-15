# AI Intent Routing & Capability Matrix

## Overview
This document defines the deterministic intent classification rules, mapped agent specializations, entity extractors, and backend tools invoked for every user input.

---

## Intent Classification & Routing Matrix

| Intent Key | Input Examples | Routed Agent | Invoked Tool | Extraction Logic / Parameters | Fallback Behavior |
|---|---|---|---|---|---|
| `CONTACT_SEARCH` | • "can you check for Muhammad Okasha in the contacts?"<br>• "find John XYZ in contacts"<br>• "search contact Sarah" | `assistant` / `crm` | `search_contacts` | Extracts target name via `AgentRouter::extractContactSearchQuery`. Searches `first_name`, `last_name`, full name concat, `email`, `phone`. | Explicitly states: *"I searched your contacts for '{query}', but no matching contact record was found."* Zero fabrication. |
| `CONTACT_CREATE` | • "create a new contact for Alex Mercer"<br>• "add contact name is Sarah Connor email sarah@acme.com" | `assistant` / `crm` | `create_contact` | Extracts `first_name`, `last_name`, regex for `email` (`[a-z0-9._%+-]+@...`), regex for `phone` (`+?[0-9]{10,15}`). | Factual confirmation with created contact details. |
| `CONTACT_UPDATE` | • "tag Muhammad Okasha with VIP"<br>• "update contact status to Qualified" | `assistant` / `crm` | `add_tag` / `update_contact` | Extracts `contact_id` and `tag` or updated attributes. | Confirms tag attachment or update status. |
| `COMPANY_SEARCH` | • "search company Acme Corp"<br>• "find company Cyberdyne" | `assistant` / `crm` | `search_companies` | Extracts company name query string. | Returns company details or declares not found. |
| `COMPANY_CREATE` | • "create company Stark Industries"<br>• "add company Wayne Enterprises" | `assistant` / `crm` | `create_company` | Extracts company name, domain, industry. | Returns created company record. |
| `TASK_CREATE` | • "create a task for Muhammad Okasha to review contract tomorrow"<br>• "add task to call lead" | `assistant` / `crm` | `create_task` | Extracts clean task title, parses `tomorrow` for `due_days: 1`, flags `urgent` for `priority: high`. | Persists task in database with due date. |
| `TASK_COMPLETE` | • "mark task as completed"<br>• "finish follow up task" | `assistant` / `crm` | `complete_task` | Resolves `task_id`. | Marks status as completed. |
| `OPPORTUNITY_CREATE` | • "create an opportunity for this contact"<br>• "add deal to pipeline" | `sales` | `create_opportunity` | Associates with conversation customer; assigns default pipeline & stage. | Factual confirmation with deal value and title. |
| `OPPORTUNITY_SEARCH` | • "show open opportunities"<br>• "search deals in pipeline" | `sales` | `search_opportunities` | Scopes to tenant open deals. | Returns opportunities with Kanban stage names. |
| `PIPELINE_REPORT` | • "show me the pipeline report"<br>• "what is our total pipeline revenue" | `sales` | `pipeline_report` | Aggregates `total_deals`, `total_value`, `won_value`, `open_deals` from database. | Real dynamic numbers computed from database. |
| `APPOINTMENT_AVAILABILITY` | • "What slots are available tomorrow?"<br>• "check openings on 2026-09-20" | `appointment` | `get_calendar_availability` | Parses target date (defaults to tomorrow); checks interval collisions with existing appointments. | Returns unbooked time slots. |
| `APPOINTMENT_BOOK` | • "Can you book me an appointment tomorrow for Sarah Connor at 10:00 AM?" | `appointment` | `create_appointment` | Extracts customer name, parses date and time, resolves customer FK, creates appointment in database. | Factual confirmation with date, time, and attendee. |
| `APPOINTMENT_RESCHEDULE` | • "reschedule my appointment to Friday at 2pm" | `appointment` | `reschedule_appointment` | Identifies appointment ID and new date/time. | Reschedules in database. |
| `APPOINTMENT_CANCEL` | • "cancel my appointment for tomorrow" | `appointment` | `cancel_appointment` | Identifies appointment ID. | Sets status to Cancelled. |
| `ORDER_STATUS` / `ORDER_TRACK` | • "Where is my order #12345?"<br>• "track order 98765" | `support` | `get_order_status` | Extracts order number via `AgentRouter::extractOrderNumber`. Queries WooCommerce & Shopify services. | If found, returns actual status & items. If not found, explicitly states order was not found. Never hallucinates delivery dates. |
| `ORDER_CANCEL` | • "cancel order #12345" | `support` | `get_order_status` / handoff | Verifies order in store. | Reports cancellation status or escalates to human. |
| `KNOWLEDGE_QUERY` | • "what is our cancellation policy?"<br>• "what is the refund procedure" | `support` / `knowledge` | `search_knowledge` | Performs semantic vector search on tenant knowledge chunks; retrieves top matching policy chunks. | If no match found: *"I searched our documentation, but could not find a specific policy matching your question."* |
| `ANALYTICS_QUERY` | • "how many contacts do we have?"<br>• "leads report" | `assistant` | `leads_report` | Queries contacts count, hot leads, qualified leads. | Factual database counts. |
| `HUMAN_REQUEST` | • "talk to a human agent"<br>• "speak to representative" | `support` | `handoff_to_human` | Updates conversation status to `waiting_for_human` and reassigns agent. | Confirms escalation to support queue. |
| `GREETING` | • "hello"<br>• "hi there"<br>• "good morning" | `assistant` | None (Direct Greeting) | None. | Returns natural, helpful greeting offering CRM, sales, appointment, or support assistance without fake order text. |
| `GENERAL_CHAT` | • "what can you do?"<br>• "how does this system work?" | `assistant` | None / Grounded | Contextual grounding if relevant. | Clear, concise overview of supported business operations. |

---

## Multi-Turn Context Switching Guarantee
When a conversation shifts across domains (e.g. Turn 1: Order Inquiry → Turn 2: Contact Search):
1. The classifier evaluates the **current user turn** independently.
2. The orchestrator updates the active agent (`assigned_agent`) to the newly required capability.
3. The ToolRegistry grants the necessary tools dynamically.
4. The system never locks the user into an outdated domain or generates irrelevant cross-domain responses.
