# DEEP QA MISSING FEATURES SPECIFICATION
**Project:** AI Conversation & Sales Suite  
**Audit Date:** September 14, 2026  
**Scope:** Gap Analysis of Architecture, PRD, and SRS against Actual Implementation  
**Total Missing Features Documented:** 15  

---

```text
MISSING ID: MISSING-001
Feature: Dynamic CRM Smart Lists Engine & Query Persistence

Expected From PRD:
Users can create, customize, save, and execute dynamic Smart Lists with composite boolean logic (AND/OR filters on tags, score, status, owner, custom fields, opportunity stage, and date ranges). Modifying a contact's properties dynamically updates Smart List memberships across the CRM.

Current State:
The frontend Screen7Leads.tsx imports a static array initialSmartLists from lib/data.ts. The backend has no SmartList model, no database migration for smart lists, and no REST routes (/smart-lists). ContactController has an internal applySmartListFilters helper, but it is completely inaccessible because no smart lists can be created, saved, or loaded.

Why It Matters:
Smart Lists are a core GoHighLevel CRM capability. Without them, sales teams cannot segment leads for automated campaigns, outreach, or workflow triggers.

Recommended Implementation:
1. Create migration for smart_lists table (id, organization_id, name, filters_json, is_pinned, created_by).
2. Create SmartList model and SmartListController with standard CRUD endpoints.
3. Expose dynamic query endpoint GET /api/v1/contacts?smart_list_id={id}.
4. Connect frontend Smart List tabs to fetch and execute saved list definitions.

Priority:
HIGH
```

```text
MISSING ID: MISSING-002
Feature: Unified Global Search API Across All CRM Entities

Expected From PRD:
A fast, global search modal (Cmd+K / Ctrl+K) that queries across Contacts, Leads, Opportunities, Companies, Conversations, Appointments, and Knowledge Documents, returning categorized results with keyboard navigation and direct navigation links.

Current State:
The frontend GlobalSearchModal.tsx renders the UI and triggers api.globalSearch(query). api.ts sends a GET request to /api/v1/search?q=..., but no such endpoint exists in Laravel. It returns HTTP 404 Not Found, leaving global search non-functional.

Why It Matters:
Global search is the primary navigation acceleration tool for CRM operators handling high volumes of inbound leads and active conversations.

Recommended Implementation:
1. Implement SearchController in Laravel with unified multi-model search:
   - Contacts: name, email, phone
   - Opportunities: title, contact_name, company
   - Conversations: customer_name, channel, last_message
   - Appointments: title, customer_name
2. Register Route::get('/search', [SearchController::class, 'search']) under auth:sanctum.
3. Scope all queries strictly by $request->user()->organization_id.

Priority:
HIGH
```

```text
MISSING ID: MISSING-003
Feature: Dedicated Contact Activity Timeline REST API

Expected From PRD:
A comprehensive chronological timeline for every contact displaying all lifecycle events: creation, status transitions, internal notes, phone calls, SMS/WhatsApp messages, appointment bookings, deals won/lost, and automated workflow triggers.

Current State:
Activities are written to the activities table on certain backend events, but no REST controller or endpoint exists to query or append to them. When Contact360Drawer calls api.getActivityTimeline(contact.id) or api.addTimelineEvent(), it hits /api/v1/timeline, which returns HTTP 404 Not Found.

Why It Matters:
Without a functional timeline, sales agents opening a contact profile have zero context on previous interactions, customer history, or pending touchpoints.

Recommended Implementation:
1. Implement ActivityController in Laravel with:
   - GET /api/v1/contacts/{contact}/activities (paginated, chronological)
   - POST /api/v1/contacts/{contact}/activities (for adding manual internal notes and custom events)
2. Register routes in backend/routes/api.php.
3. Update Contact360Drawer to consume these endpoints instead of dummy /timeline.

Priority:
HIGH
```

```text
MISSING ID: MISSING-004
Feature: User-Defined Custom Fields Definition & Validation API

Expected From PRD:
Admins can define custom fields for contacts and opportunities (e.g. text, number, date, dropdown, boolean, currency) with validation rules, options, and required flags. These fields automatically render in CRM forms and persist to database records.

Current State:
A custom_attributes JSON column exists on contacts and opportunities, and a separate CustomObjectController exists for standalone objects. However, there is no API or schema table to define custom fields for native Contacts. api.getCustomFields() calls GET /api/v1/custom-fields, which returns 404.

Why It Matters:
Businesses have unique data requirements (e.g. "Tax ID", "Budget Range", "Renewal Date"). Without a custom field definition engine, standard CRM adoption is blocked.

Recommended Implementation:
1. Create custom_fields table (id, organization_id, entity_type, field_key, field_label, field_type, options, is_required).
2. Implement CustomFieldController (index, store, update, destroy).
3. Validate contact custom_attributes against defined custom_fields schemas on store/update.

Priority:
HIGH
```

```text
MISSING ID: MISSING-005
Feature: Complete Organization Management & Sub-Account Provisioning API

Expected From PRD:
Agency admins can provision new client sub-accounts (organizations), manage organization profiles, update white-label domains, configure regional timezones, and archive/delete organizations.

Current State:
OrganizationController only provides index, show, and update. POST /api/v1/organizations and DELETE /api/v1/organizations do not exist in Laravel. Calling the "Create New Organization" modal in the frontend Header fails with HTTP 405 Method Not Allowed.

Why It Matters:
Multi-tenant agency models (GHL style) require autonomous sub-account creation. Currently, organizations can only be created via manual registration or raw database seeding.

Recommended Implementation:
1. Implement OrganizationController::store with slug auto-generation, default pipeline creation, and organization initialization.
2. Implement OrganizationController::destroy with cascading resource cleanup.
3. Register routes under role:Admin middleware.

Priority:
HIGH
```

```text
MISSING ID: MISSING-006
Feature: Production OAuth 2.0 Integration Handshakes (Google, Shopify, HubSpot)

Expected From PRD:
Standard OAuth 2.0 authentication flows for third-party integrations: redirect to provider consent screen, authorization code exchange, secure credential encryption in integration_credentials, and automatic token refresh.

Current State:
Screen10Integrations has mock modal steps that simulate progress with client-side timers. In backend/.env, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are blank. There are no OAuth redirect or callback routes for Google or HubSpot.

Why It Matters:
Enterprise integrations cannot function in production without automated OAuth credential handshakes. Users cannot be expected to generate manual bearer tokens.

Recommended Implementation:
1. Use Laravel Socialite or custom OAuth services for Google Calendar and HubSpot.
2. Implement GET /api/v1/integrations/{provider}/oauth/redirect and /oauth/callback.
3. Store encrypted tokens and refresh tokens in integration_credentials.

Priority:
HIGH
```

```text
MISSING ID: MISSING-007
Feature: Persistent Multi-Tenant Settings (Persona, BYOK, Guardrails, White-Label)

Expected From PRD:
Per-tenant settings storage allowing organizations to configure their AI assistant persona, tone of voice, bilingual Roman Urdu adaptation, discount guardrails, custom OpenAI/Gemini API keys (BYOK), and custom agency branding.

Current State:
Screen12Settings.tsx is completely decoupled from the backend. Saving settings only triggers a 3-second React state toast. The backend does not expose any endpoint to update or load organization-level settings, and all AI calls read server-level keys from .env.

Why It Matters:
Without tenant settings, every organization is forced into the exact same AI persona, server-wide API keys, and unconfigurable guardrails.

Recommended Implementation:
1. Expand organizations.settings_json or create an organization_settings table.
2. Expose GET /api/v1/settings and PATCH /api/v1/settings.
3. Update LlmOrchestratorService to prioritize tenant-configured BYOK keys and persona rules over global .env fallbacks.

Priority:
HIGH
```

```text
MISSING ID: MISSING-008
Feature: Background Queue Daemon & Automated Worker Runner

Expected From PRD:
A reliable asynchronous background queue engine (Redis / database) executing asynchronous workflow steps, delayed triggers (wait 2 hours, wait 3 days), webhook deduplication, and RAG document vectorization.

Current State:
backend/.env configures QUEUE_CONNECTION=database, but no worker process (php artisan queue:work) runs in the development or deployment setup. All dispatched jobs accumulate indefinitely in the jobs table.

Why It Matters:
Asynchronous tasks, webhook handlers, and delayed workflow automations are frozen in the database and never execute.

Recommended Implementation:
1. Provide a managed queue daemon service script (or supervisor configuration) running php artisan queue:work --tries=3.
2. Add a queue worker command to the standard run scripts.
3. Add a queue health monitoring endpoint.

Priority:
HIGH
```

```text
MISSING ID: MISSING-009
Feature: WhatsApp Business Cloud API Inbound Webhook & Message Sender

Expected From PRD:
Full two-way WhatsApp messaging integration via official Meta Graph Cloud API: webhook verification (hub.challenge), incoming message ingestion into Conversations table, and autonomous AI copilot replies.

Current State:
WhatsApp is listed in the UI catalog and channel='whatsapp' is supported in the database schema. However, no WhatsApp webhook controller, verification route, or Meta Cloud API client exists in the backend.

Why It Matters:
WhatsApp is the primary conversational commerce channel for emerging markets and international sales teams.

Recommended Implementation:
1. Implement WhatsAppController with GET /webhooks/whatsapp (hub.verify_token verification) and POST /webhooks/whatsapp (message processing).
2. Implement WhatsAppService for sending text, templates, and interactive button messages.
3. Route incoming messages into ConversationController and AI Orchestrator.

Priority:
MEDIUM
```

```text
MISSING ID: MISSING-010
Feature: Dedicated Qdrant Vector Service & Automated Collection Provisioning

Expected From PRD:
Qdrant vector database running as a clustered or standalone service with automated collection bootstrapping (kb_chunks), tenant-partitioned vector indexing, and sub-millisecond semantic search.

Current State:
Qdrant is configured as http://localhost:6333 in .env, but no Qdrant service is running. Calls to Qdrant immediately time out after 1000ms and fail over to crude in-memory SQLite substring matches.

Why It Matters:
Without a real vector store, semantic search degrades to rudimentary keyword matching and cannot scale to tens of thousands of knowledge base chunks.

Recommended Implementation:
1. Provision a running Qdrant Docker container or managed cloud cluster.
2. Add an artisan command (php artisan qdrant:init) to initialize collections with proper vector size and distance metrics.
3. Include health check in the application status monitor.

Priority:
HIGH
```

```text
MISSING ID: MISSING-011
Feature: Team Member Invitation & Role Delegation Flow

Expected From PRD:
Organization admins can invite colleagues via email, assign roles (Administrator, Manager, Agent, Viewer), and manage pending invitations. Invited users receive an activation link to set their password.

Current State:
The Team tab in Screen12Settings has an "Invite Member" modal that only pushes to local React state. There is no invitation token generation, no invitation email dispatch, and no invitation acceptance endpoint.

Why It Matters:
Agencies and businesses cannot onboard sales reps or support agents into their sub-account.

Recommended Implementation:
1. Create user_invitations table (id, organization_id, email, role, token, expires_at).
2. Implement POST /api/v1/team/invite and POST /api/v1/team/accept-invite.
3. Send branded invitation email with secure activation link.

Priority:
MEDIUM
```

```text
MISSING ID: MISSING-012
Feature: Real-Time WebSocket / SSE Streaming for Live Chat & Workflow Execution

Expected From PRD:
Instant real-time message delivery in Live Chat without manual refresh or aggressive polling, along with live token-by-token streaming from the AI Orchestrator and live visual progress updates on workflow execution nodes.

Current State:
Frontend uses HTTP polling and synchronous request/response. Chat responses wait for the entire LLM generation to complete before rendering.

Why It Matters:
Users expect modern conversational UIs to stream tokens like ChatGPT. Synchronous waits create perceived lag and high server load under polling.

Recommended Implementation:
1. Configure Laravel Reverb or Pusher for real-time WebSocket event broadcasting.
2. Implement Server-Sent Events (SSE) route GET /api/v1/ai/chat/stream for token streaming.
3. Connect frontend chat components to consume the SSE readable stream.

Priority:
MEDIUM
```

```text
MISSING ID: MISSING-013
Feature: CSV Bulk Import/Export Engine for Contacts & Deals

Expected From PRD:
Users can upload CSV files of existing leads/contacts with column mapping (first_name, email, tags, custom attributes) and export filtered Smart Lists or pipelines to CSV format.

Current State:
Only basic manual single-record creation forms exist. No file upload parsing or batch insertion pipeline exists.

Why It Matters:
Migration of existing client data from GoHighLevel, HubSpot, or spreadsheets is impossible without bulk import.

Recommended Implementation:
1. Implement ContactImportJob supporting chunked CSV parsing and deduplication.
2. Expose POST /api/v1/contacts/import and GET /api/v1/contacts/export.
3. Add column mapping wizard to frontend.

Priority:
MEDIUM
```

```text
MISSING ID: MISSING-014
Feature: Two-Way Calendar Slot Synchronization & Conflict Detection

Expected From PRD:
Dynamic calendar engine that calculates availability based on real employee working hours, buffer times between meetings, and bidirectional Google Calendar free/busy synchronization.

Current State:
AppointmentController hardcodes static availability slots ('09:00 AM', '10:00 AM', etc.) and conflict checks use exact string comparison on date and time.

Why It Matters:
Double-bookings and time-slot collisions will occur in live operations.

Recommended Implementation:
1. Store working hours and slot durations in organization settings.
2. Query active Google Calendar events to eliminate busy windows dynamically.
3. Store appointment start_time and end_time as UTC timestamps and query range intersections.

Priority:
MEDIUM
```

```text
MISSING ID: MISSING-015
Feature: Automated Webhook Replay Protection & Secret Rotation

Expected From PRD:
Webhook ingestion engine validates timestamp headers (preventing replay attacks older than 5 minutes), enforces tenant-specific HMAC secrets, and provides secret rotation from the dashboard.

Current State:
Inbound webhooks do not validate timestamp age. WooCommerceController uses a single shared secret from .env for all tenants.

Why It Matters:
Attackers can capture valid webhook payloads and replay them repeatedly to distort order counts or trigger duplicate inventory deductions.

Recommended Implementation:
1. Validate webhook timestamp header against now() - 300 seconds.
2. Look up webhook signing secrets from integration_credentials table based on store URL.

Priority:
MEDIUM
```
