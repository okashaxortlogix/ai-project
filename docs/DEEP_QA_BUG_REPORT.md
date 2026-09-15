# DEEP QA BUG REPORT — FORENSIC AUDIT DEFECT CATALOG
**Project:** AI Conversation & Sales Suite  
**Audit Date:** September 14, 2026  
**Audit Scope:** Full-System Forensic QA Across Frontend, API, Backend, Database, AI, Security, and Integrations  
**Total Defects Identified:** 28  

---

## Executive Defect Summary

| Bug ID | Title | Severity | Category | Affected Feature |
|---|---|---|---|---|
| BUG-001 | Frontend Fatal HTML/JSON Crash on Unauthenticated API Calls | CRITICAL | Frontend / API | Authentication / Session |
| BUG-002 | Default Seeded Admin User Cannot Authenticate (`password` vs `password_hash`) | CRITICAL | Backend / Database | Authentication |
| BUG-003 | Registration Crashes with Database Integrity Constraint Violation | CRITICAL | Backend / Database | User Registration |
| BUG-004 | TenantScope Middleware Written but Never Registered in Pipeline | CRITICAL | Security / Backend | Multi-Tenancy |
| BUG-005 | IDOR in ConversationController: Cross-Tenant Message Read/Write/Resolve | CRITICAL | Security / Backend | Conversations |
| BUG-006 | IDOR in WorkflowController: Any User Can View/Edit/Execute Other Tenants' Workflows | CRITICAL | Security / Backend | Workflows |
| BUG-007 | Tenant Data Leakage in OrganizationController: All Tenants Exposed | CRITICAL | Security / Backend | Multi-Tenancy / Orgs |
| BUG-008 | Untrusted `X-Organization-Id` Header Overrides Auth in Leads, Knowledge, Appointments | CRITICAL | Security / Backend | Multi-Tenancy |
| BUG-009 | Missing Backend Routes for Search, Timeline, and Custom Fields (HTTP 404) | HIGH | API / Frontend | CRM / Global Search |
| BUG-010 | HTTP Method & Route Mismatch Breaks Opportunity, Task, and Company Updates/Deletes | HIGH | API / Frontend | CRM / Opportunities |
| BUG-011 | Opportunity Creation Form Payload Mismatch (Always Fails with HTTP 422) | HIGH | Frontend / API | Opportunities |
| BUG-012 | Integrations Screen Methods Undefined in Frontend API Client (`TypeError`) | HIGH | Frontend | Integrations |
| BUG-013 | Contact 360 Fake AI Summary with Hardcoded String & Timer | MEDIUM | Frontend / AI | Contact 360 |
| BUG-014 | Contact 360 Drawer Tags and Custom Fields Never Persisted to Database | MEDIUM | Frontend | Contact 360 / Tags |
| BUG-015 | Contact 360 Leaks Unrelated Opportunity & Task Records into Empty Contacts | HIGH | Frontend / Data Integrity | Contact 360 |
| BUG-016 | Settings Screen is Completely Fake (No Backend API Persistence) | HIGH | Frontend | Settings / White-Label |
| BUG-017 | Workflows and Tasks/Companies Screens Lack `useEffect` API Data Fetching | HIGH | Frontend | Workflows / Tasks |
| BUG-018 | PHP Windows cURL SSL Certificate Verification Failure on External AI APIs | HIGH | AI / Backend | AI Orchestrator / RAG |
| BUG-019 | Foreign Key Constraint Crash in `tool_executions` Table on Uncreated Context | HIGH | AI / Database | AI Tools |
| BUG-020 | Dimension Incompatibility and Fallback Distortion in RAG Vector Cosine Search | MEDIUM | AI / Database | RAG / Knowledge Base |
| BUG-021 | Queue Worker Inactive (Dispatched Jobs Accumulate in Database Unprocessed) | HIGH | Backend / Queues | Workflows / Webhooks |
| BUG-022 | Inbound Webhooks Table Lacks Multi-Tenant Organization Scoping | HIGH | Database / Webhooks | Webhooks / E-Commerce |
| BUG-023 | Fake OAuth Social Login Handlers in Frontend Auth Screen | MEDIUM | Frontend / Auth | Authentication |
| BUG-024 | Missing Organization Creation and Deletion Routes in Backend API | MEDIUM | Backend / API | Organization Mgmt |
| BUG-025 | Unrestricted Viewer Access to Destructive Operations (RBAC Gaps) | HIGH | Security / RBAC | RBAC |
| BUG-026 | Appointment Overlap Conflict Check Relies on Static String Matching | MEDIUM | Backend / Appointments | Appointments |
| BUG-027 | Hardcoded CSAT & Response Time Metrics in Analytics Overview | LOW | Backend / Analytics | Analytics |
| BUG-028 | Associations Endpoint Does Not Verify Cross-Tenant Entity Boundaries | HIGH | Security / Backend | Custom Objects |

---

## Detailed Bug Reports

```text
BUG ID: BUG-001
Title: Frontend Fatal HTML/JSON Crash on Unauthenticated API Calls

Severity:
CRITICAL

Category:
Frontend / API

Steps to Reproduce:
1. Clear browser localStorage to ensure no auth_token is present.
2. Load the Next.js application at http://localhost:3000.
3. Observe Header.tsx mounting and executing api.getOrganizations().
4. Inspect browser devtools console and terminal.

Expected Result:
API should respond with HTTP 401 JSON ({"message": "Unauthenticated."}), and the frontend should smoothly display the login screen.

Actual Result:
Laravel Sanctum middleware intercepts the unauthenticated request. Because api.ts does not send 'Accept: application/json', Laravel assumes a web browser navigation and issues a 302 redirect to route('login'). The route 'login' in routes/api.php is mapped exclusively to POST /api/v1/auth/login. The browser follows the redirect with a GET request, resulting in HTTP 405 Method Not Allowed with an HTML error page (<!DOCTYPE html>...). When api.ts executes res.json(), JSON.parse throws SyntaxError: Unexpected token '<', causing an unhandled promise rejection and crashing the header.

Root Cause:
1. frontend/lib/api.ts getHeaders() omits the 'Accept: application/json' header.
2. routes/api.php assigns name('login') to a POST-only route (Route::post('/auth/login', ...)->name('login')).
3. api.ts executes res.json() without checking res.ok or content-type headers.

Affected Files:
- frontend/lib/api.ts
- frontend/components/Header.tsx
- backend/routes/api.php

Affected Feature:
Authentication & Session Management

Recommended Fix:
1. In frontend/lib/api.ts, add 'Accept': 'application/json' to default headers.
2. In frontend/lib/api.ts, check res.ok and content-type before attempting JSON parsing.
3. In backend/app/Http/Middleware or bootstrap/app.php, ensure all requests under /api/* force JSON response expectations.

Reproducible:
YES

Evidence:
Header.tsx line 94: "SyntaxError: Unexpected token '<', '<!DOCTYPE '... is not valid JSON".
HTTP Log: "GET /api/v1/organizations -> 302 -> GET /api/v1/auth/login -> 405 Method Not Allowed".
```

```text
BUG ID: BUG-002
Title: Default Seeded Admin User Cannot Authenticate (`password` vs `password_hash`)

Severity:
CRITICAL

Category:
Backend / Database

Steps to Reproduce:
1. Run database seeders (php artisan db:seed).
2. Attempt to log in via POST /api/v1/auth/login with credentials:
   email: "john@acme.com", password: "secret123".
3. Check the HTTP response.

Expected Result:
HTTP 200 OK with valid Sanctum Bearer token and user object.

Actual Result:
HTTP 401 Unauthorized: {"success": false, "message": "Invalid credentials provided."}.

Root Cause:
DatabaseSeeder.php seeds John Doe with 'password_hash' => bcrypt('secret123'), leaving the column 'password' as NULL. AuthController::login executes Hash::check($validated['password'], $user->password). Because $user->password is NULL, Hash::check fails unconditionally.

Affected Files:
- backend/database/seeders/DatabaseSeeder.php
- backend/app/Http/Controllers/Api/AuthController.php

Affected Feature:
Authentication

Recommended Fix:
1. In DatabaseSeeder.php, populate both 'password' and 'password_hash' with bcrypt('secret123').
2. In AuthController.php, check $user->password ?? $user->password_hash.

Reproducible:
YES

Evidence:
API execution:
node -e "fetch('http://127.0.0.1:8000/api/v1/auth/login', {method: 'POST', headers: {'Accept': 'application/json', 'Content-Type': 'application/json'}, body: JSON.stringify({email: 'john@acme.com', password: 'secret123'})}).then(r => r.text().then(console.log))"
Output: 401 {"success":false,"message":"Invalid credentials provided."}
```

```text
BUG ID: BUG-003
Title: Registration Crashes with Database Integrity Constraint Violation

Severity:
CRITICAL

Category:
Backend / Database

Steps to Reproduce:
1. Send a POST request to /api/v1/auth/register with valid payload:
   {"name": "New Admin", "email": "admin@newcorp.com", "password": "Password123!"}
2. Inspect the HTTP response and backend/storage/logs/laravel.log.

Expected Result:
HTTP 201 Created with new user record, organization, and auth token.

Actual Result:
HTTP 500 Internal Server Error:
"SQLSTATE[23000]: Integrity constraint violation: 19 NOT NULL constraint failed: users.password_hash".

Root Cause:
In migration 2025_01_01_000002_create_users_table.php, 'password_hash' is declared as a NOT NULL string without a default value. When AuthController::register executes User::create, it assigns 'password' => Hash::make(...), but leaves 'password_hash' unassigned. SQLite strictly enforces NOT NULL constraints and aborts the insert.

Affected Files:
- backend/database/migrations/2025_01_01_000002_create_users_table.php
- backend/app/Http/Controllers/Api/AuthController.php

Affected Feature:
User Registration

Recommended Fix:
In AuthController::register, set both 'password' and 'password_hash' to Hash::make($validated['password']), or modify the users table migration to make 'password_hash' nullable with 'password' as canonical.

Reproducible:
YES

Evidence:
Output from deep QA probe:
"500 SQLSTATE[23000]: Integrity constraint violation: 19 NOT NULL constraint failed: users.password_hash (Connection: sqlite, SQL: insert into 'users' ('id', 'organization_id', 'name', 'email', 'password', 'role', 'avatar', 'is_active', 'updated_at', 'created_at') values (...))".
```

```text
BUG ID: BUG-004
Title: TenantScope Middleware Written but Never Registered in Pipeline

Severity:
CRITICAL

Category:
Security / Backend

Steps to Reproduce:
1. Authenticate a user belonging to Organization A.
2. Send an API request passing header 'X-Organization-Id: <Organization B ID>'.
3. Observe whether the request is rejected with 403 Forbidden.

Expected Result:
TenantScope middleware should detect that the header organization does not match the authenticated user's organization and return HTTP 403 Forbidden: "Forbidden: Cross-tenant access violation.".

Actual Result:
The request passes through unhindered. TenantScope middleware is never executed.

Root Cause:
TenantScope.php was implemented in backend/app/Http/Middleware/TenantScope.php, but was never registered in backend/bootstrap/app.php in the middleware pipeline ($middleware->api(...) or alias).

Affected Files:
- backend/bootstrap/app.php
- backend/app/Http/Middleware/TenantScope.php

Affected Feature:
Multi-Tenant Data Isolation

Recommended Fix:
In backend/bootstrap/app.php, append \App\Http\Middleware\TenantScope::class to the API middleware group.

Reproducible:
YES

Evidence:
Grep search for TenantScope in backend/ shows it only exists in its own file definition; no references in bootstrap/app.php or routes/api.php.
```

```text
BUG ID: BUG-005
Title: IDOR in ConversationController: Cross-Tenant Message Read/Write/Resolve

Severity:
CRITICAL

Category:
Security / Backend

Steps to Reproduce:
1. Create a conversation in Organization A (ID: conv-A).
2. Authenticate as a user belonging to Organization B.
3. Send requests to:
   - GET /api/v1/conversations/conv-A
   - GET /api/v1/conversations/conv-A/messages
   - POST /api/v1/conversations/conv-A/messages
   - POST /api/v1/conversations/conv-A/handoff
   - POST /api/v1/conversations/conv-A/resolve

Expected Result:
HTTP 404 Not Found or HTTP 403 Forbidden.

Actual Result:
All operations succeed. User B can view all customer chat messages, inject messages into the conversation, escalate the conversation, and resolve the conversation.

Root Cause:
ConversationController::show, messages, sendMessage, handoff, and resolve execute Conversation::findOrFail($id) without any organization_id scoping or policy verification.

Affected Files:
- backend/app/Http/Controllers/Api/ConversationController.php

Affected Feature:
Conversations & Live Chat

Recommended Fix:
Scope all conversation queries by the authenticated user's organization:
$conv = Conversation::where('organization_id', $request->user()->organization_id)->findOrFail($id);

Reproducible:
YES

Evidence:
ConversationController.php lines 62, 68, 79, 132, 154:
All methods call Conversation::findOrFail($id) directly with no tenant check.
```

```text
BUG ID: BUG-006
Title: IDOR in WorkflowController: Any User Can View/Edit/Execute Other Tenants' Workflows

Severity:
CRITICAL

Category:
Security / Backend

Steps to Reproduce:
1. Create a workflow in Organization A (ID: wf-A).
2. Authenticate as a user belonging to Organization B.
3. Send requests to:
   - GET /api/v1/workflows/wf-A
   - PATCH /api/v1/workflows/wf-A
   - POST /api/v1/workflows/wf-A/toggle-publish
   - POST /api/v1/workflows/wf-A/execute
   - GET /api/v1/workflows/wf-A/executions

Expected Result:
HTTP 404 Not Found or HTTP 403 Forbidden.

Actual Result:
HTTP 200 OK. User B can read the entire node/edge automation graph of Organization A, modify the workflow steps, publish/unpublish it, execute it against arbitrary contacts, and read step audit execution histories.

Root Cause:
WorkflowController uses implicit route model binding (Workflow $workflow) across all member methods without verifying that $workflow->organization_id matches the requesting user's organization_id.

Affected Files:
- backend/app/Http/Controllers/Api/WorkflowController.php

Affected Feature:
Workflow Engine

Recommended Fix:
Add an authorization guard in WorkflowController:
if ($workflow->organization_id !== $request->user()->organization_id) {
    return response()->json(['success' => false, 'message' => 'Workflow not found.'], 404);
}

Reproducible:
YES

Evidence:
WorkflowController.php:71, 82, 118, 139, 169 take (Workflow $workflow) with zero tenant validation.
```

```text
BUG ID: BUG-007
Title: Tenant Data Leakage in OrganizationController: All Tenants Exposed

Severity:
CRITICAL

Category:
Security / Backend

Steps to Reproduce:
1. Create Organization A and Organization B in the database.
2. Authenticate as an Agent or Admin in Organization A.
3. Call GET /api/v1/organizations.
4. Send PATCH /api/v1/organizations/<Org-B-ID> with body {"name": "Hacked Org"}.

Expected Result:
GET should only return the authenticated user's organization. PATCH to another organization should be forbidden.

Actual Result:
GET /organizations returns an array of EVERY organization in the system. PATCH /organizations/<Org-B-ID> updates Organization B with mass assignment ($request->all()).

Root Cause:
OrganizationController::index executes Organization::all(). OrganizationController::update executes Organization::findOrFail($id)->update($request->all()) without verifying ownership or sanitizing fillable attributes.

Affected Files:
- backend/app/Http/Controllers/Api/OrganizationController.php

Affected Feature:
Multi-Tenancy & Organization Management

Recommended Fix:
1. In index(), return only $request->user()->organization.
2. In show() and update(), ensure $id === $request->user()->organization_id.
3. Use strict form request validation on update instead of $request->all().

Reproducible:
YES

Evidence:
OrganizationController.php:13: "return response()->json(['success' => true, 'data' => Organization::all()]);".
OrganizationController.php:24: "$org->update($request->all());".
```

```text
BUG ID: BUG-008
Title: Untrusted `X-Organization-Id` Header Overrides Auth in Leads, Knowledge, Appointments

Severity:
CRITICAL

Category:
Security / Backend

Steps to Reproduce:
1. Authenticate as User A belonging to Org A.
2. Send request to GET /api/v1/leads with header 'X-Organization-Id: <Org B ID>'.
3. Send request to GET /api/v1/knowledge/documents with header 'X-Organization-Id: <Org B ID>'.
4. Send request to GET /api/v1/appointments with header 'X-Organization-Id: <Org B ID>'.

Expected Result:
The backend should enforce the authenticated user's organization ($request->user()->organization_id) and ignore untrusted headers, or reject with 403 Forbidden.

Actual Result:
The endpoints execute Lead::where('organization_id', $orgId) using the client-supplied header value, returning Org B's private leads, knowledge documents, and appointment records.

Root Cause:
In LeadController.php:15, KnowledgeController.php:15, and AppointmentController.php:16, the code explicitly executes:
$orgId = $request->header('X-Organization-Id', 'org-acme-1');
completely ignoring $request->user()->organization_id.

Affected Files:
- backend/app/Http/Controllers/Api/LeadController.php
- backend/app/Http/Controllers/Api/KnowledgeController.php
- backend/app/Http/Controllers/Api/AppointmentController.php

Affected Feature:
Multi-Tenant Isolation

Recommended Fix:
Replace all instances with:
$orgId = $request->user()->organization_id;

Reproducible:
YES

Evidence:
grep_search output confirms LeadController.php:15, KnowledgeController.php:15, AppointmentController.php:16 use $request->header('X-Organization-Id', 'org-acme-1').
```

```text
BUG ID: BUG-009
Title: Missing Backend Routes for Search, Timeline, and Custom Fields (HTTP 404)

Severity:
HIGH

Category:
API / Frontend

Steps to Reproduce:
1. Press Cmd+K in UI and type a search term in GlobalSearchModal.
2. Open Contact 360 Drawer and click Activity Timeline.
3. Submit a new Internal Note inside Contact 360 Drawer.
4. Inspect network tab.

Expected Result:
Endpoints respond with HTTP 200/201 JSON.

Actual Result:
- GET /api/v1/search?q=... -> 404 Not Found
- GET /api/v1/timeline?contact_id=... -> 404 Not Found
- POST /api/v1/timeline -> 404 Not Found
- GET /api/v1/custom-fields -> 404 Not Found

Root Cause:
frontend/lib/api.ts contains definitions for globalSearch(), getActivityTimeline(), addTimelineEvent(), and getCustomFields(), but backend/routes/api.php does not declare routes for /search, /timeline, or /custom-fields.

Affected Files:
- backend/routes/api.php
- frontend/lib/api.ts
- frontend/components/GlobalSearchModal.tsx
- frontend/components/Contact360Drawer.tsx

Affected Feature:
CRM Core / Global Search / Activity Timeline

Recommended Fix:
1. Create SearchController, TimelineController, and CustomFieldController in Laravel.
2. Register the missing routes in backend/routes/api.php under Route::middleware(['auth:sanctum']).

Reproducible:
YES

Evidence:
routes/api.php does not contain any of /search, /timeline, or /custom-fields.
```

```text
BUG ID: BUG-010
Title: HTTP Method & Route Mismatch Breaks Opportunity, Task, and Company Updates/Deletes

Severity:
HIGH

Category:
API / Frontend

Steps to Reproduce:
1. In Screen18Opportunities, move an opportunity stage on the Kanban board.
2. In Screen20TasksCompanies, mark a task as completed or delete it.
3. Inspect network requests.

Expected Result:
HTTP 200 OK with updated record.

Actual Result:
HTTP 405 Method Not Allowed. Updates and deletions fail.

Root Cause:
Contract mismatch between frontend API client and Laravel router:
- api.ts executes PUT /api/v1/opportunities; routes/api.php defines PATCH /opportunities/{opportunity}.
- api.ts executes DELETE /api/v1/opportunities?id=...; routes/api.php defines DELETE /opportunities/{opportunity}.
- api.ts executes PUT /api/v1/tasks; routes/api.php defines PATCH /tasks/{task}.
- api.ts executes DELETE /api/v1/tasks?id=...; routes/api.php defines DELETE /tasks/{task}.
- api.ts executes PUT /api/v1/companies; routes/api.php defines PATCH /companies/{company}.

Affected Files:
- frontend/lib/api.ts
- backend/routes/api.php

Affected Feature:
CRM Opportunities / Tasks / Companies

Recommended Fix:
Align frontend/lib/api.ts to send PATCH and DELETE with route parameter paths (e.g. `${API_BASE}/opportunities/${id}`) matching Laravel resource conventions.

Reproducible:
YES

Evidence:
frontend/lib/api.ts:425: "method: 'PUT', url: `${API_BASE}/opportunities`".
routes/api.php:94: "Route::patch('/opportunities/{opportunity}', ...)".
```

```text
BUG ID: BUG-011
Title: Opportunity Creation Form Payload Mismatch (Always Fails with HTTP 422)

Severity:
HIGH

Category:
Frontend / API

Steps to Reproduce:
1. Navigate to Screen 18 (Opportunities).
2. Click "Add Opportunity".
3. Fill in title, contact name, contact email, value, and click "Save Opportunity".
4. Inspect network tab.

Expected Result:
HTTP 201 Created. Deal saved to database and persisted on reload.

Actual Result:
HTTP 422 Unprocessable Entity:
{"message": "The pipeline id field must be a valid UUID... The stage id field must be a valid UUID"}.
The UI optimistically shows the deal, but it is rejected by backend and vanishes on page refresh.

Root Cause:
Screen18Opportunities.tsx defaults activePipelineId to 'pipe-sales' and stage to 'stg-new'. The form sends these string slugs along with 'contact_name' and 'company_name'. OpportunityController::store strictly validates:
'pipeline_id' => 'required|uuid|exists:pipelines,id',
'stage_id' => 'required|uuid|exists:pipeline_stages,id',
'contact_id' => 'nullable|uuid|exists:contacts,id'
and rejects string slugs and unlinked names.

Affected Files:
- frontend/components/Screen18Opportunities.tsx
- backend/app/Http/Controllers/Api/OpportunityController.php

Affected Feature:
Opportunities / Pipelines

Recommended Fix:
Update Screen18Opportunities to resolve real UUIDs from the loaded pipeline and stages, resolve or create contact_id before posting, or adapt OpportunityController to auto-resolve contact_name and slugs.

Reproducible:
YES

Evidence:
Screen18Opportunities.tsx:46: "useState<string>('pipe-sales')".
OpportunityController.php:61-62: "exists:pipelines,id" / "exists:pipeline_stages,id".
```

```text
BUG ID: BUG-012
Title: Integrations Screen Methods Undefined in Frontend API Client (`TypeError`)

Severity:
HIGH

Category:
Frontend

Steps to Reproduce:
1. Navigate to Screen 10 (Integrations).
2. Click "Manage & Connect" on any integration (Shopify, WooCommerce, etc.).
3. Click "Authorize & Connect" or "Test API Handshake".
4. Inspect browser devtools console.

Expected Result:
Initiates OAuth handshake or API test.

Actual Result:
Uncaught TypeError: api.toggleIntegration is not a function.
Uncaught TypeError: api.testIntegration is not a function.
Uncaught TypeError: api.getIntegrations is not a function.

Root Cause:
Screen10Integrations.tsx invokes api.getIntegrations(), api.toggleIntegration(), and api.testIntegration(). None of these three functions exist in frontend/lib/api.ts.

Affected Files:
- frontend/components/Screen10Integrations.tsx
- frontend/lib/api.ts

Affected Feature:
Integrations

Recommended Fix:
Implement getIntegrations(), toggleIntegration(), and testIntegration() in frontend/lib/api.ts, connecting to /api/v1/integrations endpoints.

Reproducible:
YES

Evidence:
grep_search in frontend/lib/api.ts for toggleIntegration and testIntegration yields 0 results.
```

```text
BUG ID: BUG-013
Title: Contact 360 Fake AI Summary with Hardcoded String & Timer

Severity:
MEDIUM

Category:
Frontend / AI

Steps to Reproduce:
1. Open any contact in Contact 360 Drawer.
2. Click the "Generate AI Summary" button.
3. Observe the output.

Expected Result:
AI analyzes the contact's real notes, opportunities, activities, and conversations to generate a dynamic contextual summary.

Actual Result:
A 900ms setTimeout executes and outputs an identical hardcoded string regardless of contact:
"🎯 **AI Contact 360 Summary**: ... high-intent enterprise prospect from Apex Logistics (Lead Score: 94)... $28,500 deal value... before May 2."

Root Cause:
Contact360Drawer.tsx lines 138-146 implements handleGenerateAiSummary using a hardcoded setTimeout and static string template.

Affected Files:
- frontend/components/Contact360Drawer.tsx

Affected Feature:
Contact 360 / AI Summarization

Recommended Fix:
Call backend /api/v1/ai/chat with prompt to summarize contact profile using real contact context and return streaming or structured LLM output.

Reproducible:
YES

Evidence:
Contact360Drawer.tsx:142: Hardcoded string literal containing "Apex Logistics" and "May 2".
```

```text
BUG ID: BUG-014
Title: Contact 360 Drawer Tags and Custom Fields Never Persisted to Database

Severity:
MEDIUM

Category:
Frontend

Steps to Reproduce:
1. Open a contact in Contact 360 Drawer.
2. Add a new tag (e.g. "VIP Client") or remove an existing tag.
3. Modify custom fields.
4. Close the drawer and reopen it, or refresh the browser.

Expected Result:
Modified tags and custom fields remain saved on the contact record.

Actual Result:
All added tags, removed tags, and custom field edits revert to default. Nothing is saved.

Root Cause:
In Contact360Drawer.tsx:125-136, handleAddTag and handleRemoveTag only modify local React state (setTags) and do not dispatch any HTTP request to the backend. Custom fields are held in a static useState object.

Affected Files:
- frontend/components/Contact360Drawer.tsx

Affected Feature:
Contact 360 / Tags

Recommended Fix:
In handleAddTag and handleRemoveTag, send PATCH /api/v1/contacts/{id} with updated tags array.

Reproducible:
YES

Evidence:
Contact360Drawer.tsx:128: "setTags([...tags, newTagInput.trim()])" with no API fetch.
```

```text
BUG ID: BUG-015
Title: Contact 360 Leaks Unrelated Opportunity & Task Records into Empty Contacts

Severity:
HIGH

Category:
Frontend / Data Integrity

Steps to Reproduce:
1. Create a brand new contact with no deals or tasks.
2. Open Contact 360 Drawer for this contact.
3. Inspect the Deals and Tasks tabs.

Expected Result:
Empty states: "No active opportunities found", "No tasks assigned".

Actual Result:
The drawer displays another customer's deals and tasks.

Root Cause:
In Contact360Drawer.tsx:78 and 86:
setOpportunities(contactOpps.length > 0 ? contactOpps : res.data.slice(0, 1));
setTasks(contactTasks.length > 0 ? contactTasks : res.data.slice(0, 2));
If the contact has no associated deals or tasks, the code slices unrelated items from the global organization list and presents them as belonging to this contact.

Affected Files:
- frontend/components/Contact360Drawer.tsx

Affected Feature:
Contact 360 / Data Consistency

Recommended Fix:
Remove fallback slicing:
setOpportunities(contactOpps);
setTasks(contactTasks);
Render clear empty state components when arrays are empty.

Reproducible:
YES

Evidence:
Contact360Drawer.tsx lines 78 and 86 explicit code inspection.
```

```text
BUG ID: BUG-016
Title: Settings Screen is Completely Fake (No Backend API Persistence)

Severity:
HIGH

Category:
Frontend

Steps to Reproduce:
1. Navigate to Screen 12 (Settings).
2. Change Brand Tone, Assistant Name, API Keys, or White-Label domain.
3. Click "Save Changes" or "Save Persona Configuration".
4. Refresh the page.

Expected Result:
Settings are persisted to the database and reloaded.

Actual Result:
Settings revert immediately. Form submissions only trigger a client-side setTimeout showing a fake "Settings updated successfully" banner. No network requests are made.

Root Cause:
Screen12Settings.tsx lines 104-108:
handleSaveGeneral executes setSaveToast(true); setTimeout(() => setSaveToast(false), 3000);
All tab save buttons call identical local toast timers.

Affected Files:
- frontend/components/Screen12Settings.tsx

Affected Feature:
Settings & Organization Customization

Recommended Fix:
Connect form submissions to PATCH /api/v1/organizations/{id} with settings_json payload, and fetch settings on mount.

Reproducible:
YES

Evidence:
Screen12Settings.tsx:104:
const handleSaveGeneral = (e: React.FormEvent) => {
  e.preventDefault();
  setSaveToast(true);
  setTimeout(() => setSaveToast(false), 3000);
};
```

```text
BUG ID: BUG-017
Title: Workflows and Tasks/Companies Screens Lack `useEffect` API Data Fetching

Severity:
HIGH

Category:
Frontend

Steps to Reproduce:
1. Create a workflow via POST /api/v1/workflows or a task via POST /api/v1/tasks.
2. Open Screen 19 (Workflows) or Screen 20 (Tasks & Companies) in the frontend.
3. Inspect the list.

Expected Result:
Newly created database workflows, tasks, and companies appear in the UI.

Actual Result:
Only hardcoded demo items from lib/data.ts (initialWorkflows, initialTasks, initialCompanies) appear. Database records are invisible.

Root Cause:
Neither Screen19Workflows.tsx nor Screen20TasksCompanies.tsx contains a useEffect hook calling api.getWorkflows(), api.getTasks(), or api.getCompanies() on mount.

Affected Files:
- frontend/components/Screen19Workflows.tsx
- frontend/components/Screen20TasksCompanies.tsx

Affected Feature:
Workflows / Tasks / Companies

Recommended Fix:
Add useEffect hooks in both components to fetch live data from the backend API on mount.

Reproducible:
YES

Evidence:
grep_search in Screen19Workflows.tsx for useEffect yields 0 results.
grep_search in Screen20TasksCompanies.tsx for useEffect yields 0 results.
```

```text
BUG ID: BUG-018
Title: PHP Windows cURL SSL Certificate Verification Failure on External AI APIs

Severity:
HIGH

Category:
AI / Backend

Steps to Reproduce:
1. Trigger an AI chat message or RAG query in the live environment.
2. Inspect backend/storage/logs/laravel.log.

Expected Result:
HTTP calls to OpenAI (https://api.openai.com) and Gemini (https://generativelanguage.googleapis.com) execute successfully with valid TLS handshakes.

Actual Result:
cURL error 60: SSL certificate OpenSSL verify result: unable to get local issuer certificate (20).

Root Cause:
The Windows PHP runtime does not have curl.cainfo configured pointing to a valid cacert.pem certificate bundle, causing all outgoing HTTPS requests through Guzzle/cURL to fail certificate verification unless verify is set or local bundle is provided.

Affected Files:
- backend/app/Services/AI/LlmOrchestratorService.php
- backend/app/Services/Knowledge/RAGService.php

Affected Feature:
AI Chat / RAG Embeddings

Recommended Fix:
Configure curl.cainfo and openssl.cafile in php.ini, or download cacert.pem to storage/certs and reference it in Guzzle client configurations.

Reproducible:
YES

Evidence:
laravel.log lines 1359, 1360, 1362:
"OpenAI embedding failed: cURL error 60: SSL certificate OpenSSL verify result: unable to get local issuer certificate (20)".
```

```text
BUG ID: BUG-019
Title: Foreign Key Constraint Crash in `tool_executions` Table on Uncreated Context

Severity:
HIGH

Category:
AI / Database

Steps to Reproduce:
1. Send a POST request to /api/v1/ai/chat with message: "Find contact Alice", conversationId: null, and header X-Organization-Id: undefined.
2. Inspect response.

Expected Result:
HTTP 400 Bad Request: "Missing organization context".

Actual Result:
HTTP 500 Internal Server Error:
"SQLSTATE[23000]: Integrity constraint violation: 19 FOREIGN KEY constraint failed on tool_executions".

Root Cause:
AiChatController checks if (!$orgId), but string 'undefined' is truthy. ToolRegistry::execute attempts ToolExecution::create with organization_id: 'undefined'. The database table tool_executions enforces a foreign key constraint to organizations(id), triggering an uncaught PDOException.

Affected Files:
- backend/app/Http/Controllers/Api/AiChatController.php
- backend/app/Tools/ToolRegistry.php

Affected Feature:
AI Tool-Calling

Recommended Fix:
Validate that $orgId is a valid UUID and verify Organization::where('id', $orgId)->exists() before invoking orchestrator or tool registry.

Reproducible:
YES

Evidence:
laravel.log line 1300:
"PDOException: SQLSTATE[23000]: Integrity constraint violation: 19 FOREIGN KEY constraint failed at ... insert into 'tool_executions'".
```

```text
BUG ID: BUG-020
Title: Dimension Incompatibility and Fallback Distortion in RAG Vector Cosine Search

Severity:
MEDIUM

Category:
AI / Database

Steps to Reproduce:
1. Index a document while OpenAI or Gemini is available (1536 or 768 dimensions).
2. Query the document while cloud API is down (fallback uses 384 dimensions).
3. Compute cosine similarity in RAGService.

Expected Result:
System should detect embedding model mismatch and re-embed or gracefully degrade.

Actual Result:
RAGService::cosineSimilarity truncates vector comparison to min(count($a), count($b)) = 384, calculating dot products and norms across partial vector slices from two completely different vector spaces. Similarity scores are mathematically invalid.

Root Cause:
RAGService.php lines 263-279 blindly compares vectors of mismatched dimensionality without verifying model origin.

Affected Files:
- backend/app/Services/Knowledge/RAGService.php

Affected Feature:
RAG & Vector Search

Recommended Fix:
Store embedding_model metadata alongside embeddings in knowledge_chunks. If query embedding model differs from chunk embedding model, regenerate embeddings using matching provider.

Reproducible:
YES

Evidence:
RAGService.php:263: "$len = min(count($a), count($b));".
```

```text
BUG ID: BUG-021
Title: Queue Worker Inactive (Dispatched Jobs Accumulate in Database Unprocessed)

Severity:
HIGH

Category:
Backend / Queues

Steps to Reproduce:
1. Trigger a workflow with delayed actions or send an inbound webhook.
2. Check database table 'jobs' using php artisan tinker.

Expected Result:
Background worker picks up jobs, processes them, and clears the queue.

Actual Result:
Jobs sit in the jobs table indefinitely. Delayed workflow steps, webhook syncs, and async indexing never run.

Root Cause:
backend/.env sets QUEUE_CONNECTION=database, but no queue daemon (php artisan queue:work) is running as a service or background task.

Affected Files:
- backend/.env
- backend/app/Jobs/ExecuteWorkflowJob.php
- backend/app/Jobs/ProcessInboundWebhookJob.php

Affected Feature:
Queue Processing / Workflows

Recommended Fix:
Run php artisan queue:work as a monitored background daemon in development and production environments.

Reproducible:
YES

Evidence:
Process list shows only artisan serve (port 8000) and next dev (port 3000) running; no queue worker active.
```

```text
BUG ID: BUG-022
Title: Inbound Webhooks Table Lacks Multi-Tenant Organization Scoping

Severity:
HIGH

Category:
Database / Webhooks / Multi-Tenancy

Steps to Reproduce:
1. Inspect migration 2026_09_14_150000_create_inbound_webhooks_table.php.
2. Attempt to route a webhook to a specific organization.

Expected Result:
Webhooks are scoped to an organization_id so that Tenant A and Tenant B can independently receive events from separate stores.

Actual Result:
inbound_webhooks has no organization_id column. All webhooks are stored globally, and WooCommerceController uses a single shared secret from env('WOOCOMMERCE_WEBHOOK_SECRET').

Root Cause:
Schema omits organization_id foreign key, and webhook controller does not support multi-tenant URL parameters (e.g. /webhooks/{organization_id}/woocommerce).

Affected Files:
- backend/database/migrations/2026_09_14_150000_create_inbound_webhooks_table.php
- backend/app/Http/Controllers/Api/WooCommerceController.php

Affected Feature:
Webhooks & E-Commerce Integrations

Recommended Fix:
Add organization_id to inbound_webhooks table and update webhook routes to accept tenant identifiers or match by store domain.

Reproducible:
YES

Evidence:
Migration file 2026_09_14_150000_create_inbound_webhooks_table.php contains columns: id, provider, event_id, event_type, payload_hash, payload_json, status, processed_at, timestamps — NO organization_id.
```

```text
BUG ID: BUG-023
Title: Fake OAuth Social Login Handlers in Frontend Auth Screen

Severity:
MEDIUM

Category:
Frontend / Auth

Steps to Reproduce:
1. On login screen (Screen1Auth), click "Google", "GitHub", or "Microsoft" buttons.
2. Inspect network requests.

Expected Result:
Redirects to third-party OAuth provider authorization consent URL.

Actual Result:
Calls api.login('<provider>@acme.com', 'secret123') directly.

Root Cause:
Screen1Auth.tsx:74-96 implements handleOAuthLogin by synthesizing a dummy email string and attempting password login.

Affected Files:
- frontend/components/Screen1Auth.tsx

Affected Feature:
Authentication

Recommended Fix:
Implement real Socialite OAuth endpoints in Laravel (GET /api/v1/auth/{provider}/redirect and GET /api/v1/auth/{provider}/callback) and redirect user accordingly.

Reproducible:
YES

Evidence:
Screen1Auth.tsx:78: "const oauthEmail = `${provider.toLowerCase()}@acme.com`; const res = await api.login(oauthEmail, 'secret123');".
```

```text
BUG ID: BUG-024
Title: Missing Organization Creation and Deletion Routes in Backend API

Severity:
MEDIUM

Category:
Backend / API

Steps to Reproduce:
1. In Header.tsx, open organization dropdown and click "+ Create Organization".
2. Enter organization name and submit.
3. Inspect network response.

Expected Result:
HTTP 201 Created with new organization object.

Actual Result:
HTTP 405 Method Not Allowed.

Root Cause:
frontend/components/Header.tsx:114 calls api.createOrganization(), which sends POST to /api/v1/organizations. backend/routes/api.php does not define a POST route for organizations; only GET and PATCH exist.

Affected Files:
- backend/routes/api.php
- backend/app/Http/Controllers/Api/OrganizationController.php
- frontend/components/Header.tsx

Affected Feature:
Organization Management

Recommended Fix:
Add Route::post('/organizations', [OrganizationController::class, 'store']) and implement store method in OrganizationController.

Reproducible:
YES

Evidence:
routes/api.php lines 52-54 define only:
Route::get('/organizations', ...);
Route::get('/organizations/{organization}', ...);
Route::patch('/organizations/{organization}', ...);
```

```text
BUG ID: BUG-025
Title: Unrestricted Viewer Access to Destructive Operations (RBAC Gaps)

Severity:
HIGH

Category:
Security / RBAC

Steps to Reproduce:
1. Authenticate as a user with role 'Viewer'.
2. Send DELETE /api/v1/tasks/{task}.
3. Send DELETE /api/v1/knowledge/documents/{document}.
4. Send POST /api/v1/workflows/{workflow}/toggle-publish.

Expected Result:
HTTP 403 Forbidden: "Forbidden: User role 'Viewer' does not have required permissions.".

Actual Result:
HTTP 200 OK. The Viewer user successfully deletes tasks, removes knowledge base documents, and publishes/unpublishes automation workflows.

Root Cause:
routes/api.php attaches middleware('role:Admin,Manager') to contacts, companies, and opportunities deletions, but omits role middleware on tasks, knowledge documents, agents, and workflows.

Affected Files:
- backend/routes/api.php

Affected Feature:
Role-Based Access Control (RBAC)

Recommended Fix:
Apply middleware('role:Admin,Manager') to all destructive and configuration modification routes in routes/api.php.

Reproducible:
YES

Evidence:
routes/api.php:102: "Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);" has no middleware attached.
routes/api.php:139: "Route::delete('/knowledge/documents/{document}', [KnowledgeController::class, 'destroy']);" has no middleware attached.
```

```text
BUG ID: BUG-026
Title: Appointment Overlap Conflict Check Relies on Static String Matching

Severity:
MEDIUM

Category:
Backend / Appointments

Steps to Reproduce:
1. Book an appointment for 2026-10-01 at "11:00 AM".
2. Book another appointment for 2026-10-01 at "11:00" (without AM) or overlapping window "11:15 AM".
3. Check if second booking is accepted.

Expected Result:
Overlapping appointment times are detected and rejected with HTTP 422.

Actual Result:
Second booking succeeds because conflict check tests:
Appointment::where('date', $date)->where('time', $time)->exists().
Different string formatting or overlapping duration bypasses conflict validation.

Root Cause:
AppointmentController::store performs raw string matching rather than parsing datetime intervals and checking duration bounds.

Affected Files:
- backend/app/Http/Controllers/Api/AppointmentController.php

Affected Feature:
Appointments

Recommended Fix:
Store appointments with start_time and end_time timestamps and execute range collision queries:
where('start_time', '<', $newEnd)->where('end_time', '>', $newStart).

Reproducible:
YES

Evidence:
AppointmentController.php lines 80-88 exact code inspection.
```

```text
BUG ID: BUG-027
Title: Hardcoded CSAT & Response Time Metrics in Analytics Overview

Severity:
LOW

Category:
Backend / Analytics

Steps to Reproduce:
1. Send GET /api/v1/analytics/overview.
2. Inspect returned fields csat_score, avg_response_time, and agent_performance satisfaction.

Expected Result:
Metrics reflect true database calculations from customer satisfaction surveys and message timestamps.

Actual Result:
Metrics contain hardcoded constants: avg_response_time is always '0.8s', CSAT score falls back to static 92.5%, and agent satisfaction rates are hardcoded to 98%, 94%, 97%.

Root Cause:
AnalyticsController::overview lines 50-76 hardcodes fallback values rather than querying real response logs.

Affected Files:
- backend/app/Http/Controllers/Api/AnalyticsController.php

Affected Feature:
Analytics

Recommended Fix:
Compute real average response times using message timestamp differentials between customer and agent replies.

Reproducible:
YES

Evidence:
AnalyticsController.php:61: "'avg_response_time' => '0.8s'".
AnalyticsController.php:73-75: satisfaction rates hardcoded to '98%', '94%', '97%'.
```

```text
BUG ID: BUG-028
Title: Associations Endpoint Does Not Verify Cross-Tenant Entity Boundaries

Severity:
HIGH

Category:
Security / Backend

Steps to Reproduce:
1. Authenticate as a user in Organization A.
2. Send POST /api/v1/associations with:
   source_type: "contact", source_id: "<Contact in Org B>",
   target_type: "custom_object", target_id: "<Record in Org B>".

Expected Result:
HTTP 404 Not Found or HTTP 403 Forbidden.

Actual Result:
HTTP 201 Created. Association record is created linking entities across tenants.

Root Cause:
CustomObjectController::associate accepts source_id and target_id without querying the corresponding entity models to ensure they belong to the authenticated user's organization.

Affected Files:
- backend/app/Http/Controllers/Api/CustomObjectController.php

Affected Feature:
Custom Objects & Associations

Recommended Fix:
Verify entity ownership before creating association:
Ensure source entity belongs to $orgId and target entity belongs to $orgId.

Reproducible:
YES

Evidence:
CustomObjectController.php:152 creates Association::firstOrCreate without verifying entity existence or tenant ownership.
```
