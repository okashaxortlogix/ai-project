# AI Tool Calling Forensic Audit

## Overview
Every AI tool registered in `ToolRegistry.php` was audited for parameter validation, tenant isolation, database transactions, execution latency tracking, audit logging, error handling, and return schemas.

---

## Tool-By-Tool Forensic Matrix

| Tool Name | Allowed Agents | Parameters | Tenant Scoping | Database Operation | Return Schema | Error Handling | Audit Logged |
|---|---|---|---|---|---|---|---|
| `search_contacts` | `assistant`, `crm`, `sales`, `support`, `appointment` | `query` (optional string), `status` (optional string) | `organization_id` mandatory in `where()` | Eager loads `tags` and `companies` from SQLite `contacts` table | `{ success, count, query, data: [...] }` | Safe empty array `{ count: 0, data: [] }` | Yes (`tool_executions` & `audit_logs`) |
| `get_contact` | `assistant`, `crm`, `sales`, `support` | `contact_id` (required UUID) | `organization_id` mandatory in `where()` | Loads `tags`, `opportunities`, `tasks`, `companies` | `{ success: true, data: Contact }` | `{ success: false, error: 'Contact not found.' }` | Yes |
| `create_contact` | `assistant`, `crm`, `sales` | `first_name` (required), `last_name`, `email`, `phone`, `status`, `score` | Created with `organization_id` | `Contact::create()` | `{ success: true, data: Contact }` | Safe validation failure return | Yes |
| `update_contact` | `assistant`, `crm`, `sales` | `contact_id` (required), fields to update | Scoped to `organization_id` | `Contact::update()` | `{ success: true, data: Contact }` | Returns 404/false if contact not found | Yes |
| `add_tag` | `assistant`, `crm`, `sales` | `contact_id` (required), `tag` (required string) | Scoped to `organization_id` | `Tag::firstOrCreate` & `tags()->syncWithoutDetaching` with UUID PK | `{ success: true, message: "Tag '...' attached." }` | Fails if contact missing | Yes |
| `remove_tag` | `assistant`, `crm` | `contact_id` (required), `tag` (required string) | Scoped to `organization_id` | `Tag::where` & `tags()->detach` | `{ success: true, message: "Tag '...' detached." }` | Fails if contact missing | Yes |
| `search_companies` | `assistant`, `crm` | `query` (optional string) | Scoped to `organization_id` | `Company::where('name', 'like', ...)` | `{ success: true, data: Company[] }` | Empty array if not found | Yes |
| `create_company` | `assistant`, `crm` | `name` (required), `domain`, `industry` | Created with `organization_id` | `Company::create()` | `{ success: true, data: Company }` | Validation error return | Yes |
| `search_opportunities` | `assistant`, `crm`, `sales` | `status` (optional string) | Scoped to `organization_id` | Eager loads `stage`, `contact` | `{ success: true, data: Opportunity[] }` | Empty array if not found | Yes |
| `create_opportunity` | `assistant`, `crm`, `sales` | `title` (required), `value`, `contact_id`, `pipeline_id`, `stage_id` | Created with `organization_id` | `Opportunity::create()` with fallback to tenant pipeline & stage | `{ success: true, data: Opportunity }` | Fails gracefully if title missing | Yes |
| `move_stage` | `assistant`, `crm`, `sales` | `opportunity_id` (required), `stage_id` (required) | Scoped to `organization_id` | `Opportunity::update(['stage_id' => ...])` | `{ success: true, data: Opportunity }` | Fails if opportunity not found | Yes |
| `close_opportunity` | `assistant`, `crm`, `sales` | `opportunity_id` (required), `status` ('won'/'lost') | Scoped to `organization_id` | `Opportunity::update(['status' => ...])` | `{ success: true, data: Opportunity }` | Fails if opportunity not found | Yes |
| `create_task` | `assistant`, `crm`, `sales`, `support` | `title` (required), `priority`, `due_days`, `contact_id` | Created with `organization_id` | `Task::create()` with parsed `due_date` | `{ success: true, data: Task }` | Validation error return | Yes |
| `complete_task` | `assistant`, `crm` | `task_id` (required) | Scoped to `organization_id` | `Task::update(['status' => 'completed'])` | `{ success: true, data: Task }` | Fails if task not found | Yes |
| `get_calendar_availability` | `assistant`, `crm`, `appointment`, `support` | `date` (YYYY-MM-DD) | Scoped to `organization_id` | Queries `Appointment::where('date', $date)` and calculates unbooked intervals | `{ success: true, date, available_slots, booked_slots }` | Failsafe slot fallback | Yes |
| `create_appointment` | `assistant`, `crm`, `appointment`, `support` | `title`, `customer_name`, `date`, `time`, `service` | Created with `organization_id` | Resolves/creates `Customer`, parses `start_at` & `end_at`, saves `Appointment` | `{ success: true, data: Appointment }` | Foreign key and datetime handling | Yes |
| `reschedule_appointment` | `assistant`, `crm`, `appointment` | `appointment_id`, `new_date`, `new_time` | Scoped to `organization_id` | Updates appointment record | `{ success: true, data: Appointment }` | 404 if not found | Yes |
| `cancel_appointment` | `assistant`, `crm`, `appointment` | `appointment_id` | Scoped to `organization_id` | Updates status to `Cancelled` | `{ success: true, data: Appointment }` | 404 if not found | Yes |
| `pipeline_report` | `assistant`, `crm`, `sales` | none | Scoped to `organization_id` | Computes count, total value, won value, open deals | `{ success: true, total_deals, total_value, won_value, open_deals }` | Safe zeroes if empty | Yes |
| `leads_report` | `assistant`, `crm` | none | Scoped to `organization_id` | Computes total contacts, hot leads, qualified leads | `{ success: true, total_contacts, hot_leads, qualified }` | Safe zeroes if empty | Yes |
| `search_knowledge` | `assistant`, `crm`, `sales`, `appointment`, `support` | `query` (required string) | Scoped to `organization_id` via `RAGService` | Vector similarity search over `knowledge_chunks` | `{ success: true, count, data: [...] }` | Returns empty array if no match | Yes |
| `get_order_status` | `assistant`, `crm`, `support` | `order_number` (required string) | Scoped to tenant stores | Queries WooCommerce & Shopify services | `{ success: true, provider, order_id, status, total, line_items }` | `{ success: false, error: 'Order #... was not found...' }` | Yes |
| `handoff_to_human` | `assistant`, `crm`, `sales`, `appointment`, `support` | none | Scoped to conversation | Updates conversation status to `waiting_for_human` | `{ success: true, message: '...' }` | Safe execution | Yes |

---

## Authorization & Tenant Boundary Isolation Audit
1. **Tenant ID Injection**: Every tool receives `$orgId` from authenticated user session (`auth('sanctum')->user()->organization_id`) or verified conversation context.
2. **Unauthorized Cross-Tenant Tool Rejection**: In Step 11 of the forensic test suite, Tenant B attempted to query `Muhammad Okasha` (a Tenant A contact). The tool executed with Tenant B's organization ID, returning 0 records. No data leakage occurs.
3. **Execution Audit Logs**: Every tool invocation logs `organization_id`, `tool_name`, `latency_ms`, input JSON, output JSON, and status to the `tool_executions` and `audit_logs` tables.
