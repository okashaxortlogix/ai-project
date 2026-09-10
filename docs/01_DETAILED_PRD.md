# AI Conversation & Sales Suite — Detailed Product Requirements Document

## 1. Document purpose
This document is the source of truth for product implementation. An implementation agent should use it together with the SRS, architecture, ERD, API specification, AI agent specification, security specification, testing plan and phase plan.

## 2. Product definition
The product is a multi-tenant AI customer communication platform. A business connects its website and optional external services. Customers communicate through an AI chat experience. The platform routes requests to specialized agents and safely performs supported actions.

### Core agents
1. Support Agent — answers questions, resolves routine issues and escalates.
2. Sales Agent — understands buying intent, qualifies leads and drives next steps.
3. Appointment Agent — checks availability and manages bookings.

All agents share:
- one conversation engine
- one customer/contact model
- one knowledge base
- one tool/action layer
- one permissions system
- one analytics system
- one human handoff system.

## 3. Product goals
- Reduce repetitive support workload.
- Capture and qualify leads 24/7.
- Increase appointment conversion.
- Give customers immediate answers.
- Ground answers in approved business knowledge.
- Safely connect AI to business systems.
- Give organizations visibility over conversations and AI performance.

## 4. Non-goals
The MVP does not attempt to:
- train a foundation model
- give an LLM unrestricted access to databases
- replace every CRM
- execute arbitrary browser automation
- autonomously make high-risk financial/legal decisions
- support every messaging channel from day one.

## 5. Tenancy model
An Organization is the tenant boundary. All business data must be tenant scoped. A request must resolve the authenticated organization before accessing business records.

## 6. Roles
- Owner: full organization control.
- Admin: operational/configuration control.
- Manager: analytics, assignment and operational oversight.
- Agent: conversations, leads and appointments within permission.
- Viewer: read-only access.

## 7. Authentication
Users authenticate to the dashboard. API requests carry authenticated identity and organization context. Public website chat uses a public widget key/session mechanism that is intentionally limited and never grants dashboard privileges.

## 8. Dashboard
The dashboard contains:
- overview metrics
- live conversation inbox
- contacts
- leads
- appointments
- knowledge base
- AI agents
- integrations
- analytics
- team
- settings
- audit/usage where permitted.

## 9. Website chat widget
Requirements:
- embeddable script
- organization-specific public widget configuration
- welcome message
- business branding
- responsive UI
- conversation persistence
- typing/streaming state
- error state
- human handoff
- optional contact capture
- attachment support only when explicitly enabled.

The widget must not expose private API keys.

## 10. Conversation lifecycle
```text
NEW → ACTIVE → WAITING_FOR_CUSTOMER → ACTIVE
                     |
                     v
              WAITING_FOR_HUMAN
                     |
                     v
                  RESOLVED
                     |
                     v
                  ARCHIVED
```

A conversation stores channel, customer, current agent, status, assignment, metadata and timestamps.

## 11. Message lifecycle
A message can be:
- received
- queued
- processing
- completed
- failed
- redacted/deleted according to policy.

The backend records usage metadata when available.

## 12. AI orchestration
For every incoming customer message:
1. Authenticate/resolve session.
2. Resolve organization.
3. Load conversation state.
4. Load customer context permitted for this conversation.
5. Detect intent.
6. Select agent.
7. Retrieve relevant knowledge.
8. Determine allowed tools.
9. Call the selected model.
10. If model requests a tool, validate and execute it.
11. Feed safe tool result back to model.
12. Generate final response.
13. Store response and usage.
14. Emit analytics/audit events.
15. Stream response to client.

## 13. Support Agent
Capabilities:
- FAQ answers
- business information
- policy explanation
- troubleshooting
- supported order/customer lookup
- support ticket/handoff.

Rules:
- never invent policy
- distinguish known vs unknown information
- escalate when confidence is insufficient
- do not expose internal instructions
- do not reveal private customer information to unauthorized people.

## 14. Sales Agent
Capabilities:
- understand intent
- discover needs
- explain approved products/services
- handle basic objections factually
- collect qualification data
- create/update lead
- offer appointment or next step.

The agent must avoid deceptive urgency, fabricated scarcity, false claims or pressure tactics.

## 15. Appointment Agent
Capabilities:
- identify service
- ask required booking information
- query real availability
- offer valid slots
- confirm user choice
- create appointment
- store external event ID
- reschedule/cancel where supported
- confirm only after provider success.

## 16. Human handoff
Handoff triggers:
- explicit request
- repeated failure
- low retrieval confidence
- sensitive complaint
- unsupported request
- organization-defined rule.

When handed off, AI must obey the configured pause/read-only policy.

## 17. Knowledge base
Admins upload:
- PDFs
- text documents
- FAQs
- product/service information
- SOPs
- policies.

Pipeline:
```text
Upload → Validate → Extract → Clean → Chunk → Embed → Qdrant → Index
```

Every chunk must include organization and document identifiers.

## 18. RAG behavior
RAG is for knowledge. It is not the source of truth for dynamic state.

Use RAG for:
- policies
- FAQs
- static product descriptions
- internal instructions.

Use tools/APIs for:
- current stock
- order status
- appointment availability
- CRM state
- current customer records.

## 19. Tool layer
Each tool defines:
- name
- description
- input schema
- output schema
- required permission
- tenant scope
- rate limit
- timeout
- audit policy
- retry policy.

Example:
```text
get_calendar_availability
create_appointment
create_lead
update_lead
get_customer
search_knowledge
handoff_to_human
```

## 20. CRM
Internal models:
- contacts
- leads
- lead stages
- owners
- tags
- notes
- events.

External CRM integrations synchronize using provider IDs and idempotency.

## 21. Appointments
Fields:
- organization
- customer
- service
- provider/calendar
- start/end
- timezone
- status
- external event ID
- cancellation/reschedule metadata.

## 22. Integrations
Architecture must use adapters/interfaces:
```text
IntegrationInterface
├── CalendarProvider
├── CRMProvider
├── NotificationProvider
└── EcommerceProvider
```
A provider implementation must not leak provider-specific details into core business logic.

## 23. Notifications
Events:
- lead created
- appointment booked
- appointment changed
- handoff requested
- integration failed
- system alert.

Use Redis-backed jobs.

## 24. Analytics
Track:
- conversation count
- messages
- resolution rate
- handoff rate
- lead count
- qualified lead count
- appointments
- conversion events
- agent usage
- tool usage
- latency
- token usage
- estimated AI cost where available
- failures.

## 25. Admin configuration
Organization admin can configure:
- business profile
- business hours
- timezone
- agent enable/disable
- agent tone/instructions
- escalation rules
- knowledge sources
- integrations
- notification rules
- retention settings
- widget appearance.

## 26. Search
Dashboard search should support contacts, conversations, leads and documents. Public AI search uses semantic retrieval through Qdrant.

## 27. File handling
Files require:
- MIME validation
- size limits
- safe filenames
- storage abstraction
- authorization
- malware/security scanning where available
- lifecycle/deletion handling.

## 28. Audit
Audit important actions:
- role changes
- integration connection/removal
- agent configuration
- knowledge changes
- external tool actions
- human takeover
- data deletion.

## 29. Performance
Target:
- dashboard API p95 suitable for interactive use
- streaming AI response where provider supports it
- asynchronous document indexing
- asynchronous notifications
- indexed MySQL foreign keys and frequent filters
- pagination for lists.

## 30. Reliability
No external action may be represented as successful until the provider confirms it. Retries must be idempotent where possible.

## 31. Privacy
Only collect data required for product operation. Provide retention/deletion mechanisms appropriate to the organization's policy and applicable law.

## 32. MVP
MVP includes:
- auth
- organizations/RBAC
- dashboard
- website widget
- conversations
- AI orchestrator
- three agents
- RAG
- lead management
- Google Calendar
- human handoff
- analytics
- audit logs.

## 33. V2
- additional messaging channels
- more CRMs
- ecommerce tools
- advanced automation
- billing
- local/private AI options
- agent evaluation suite
- voice agent with explicit usage controls.

## 34. Definition of done
A feature is done only when:
- UI exists where needed
- API exists
- validation exists
- authorization exists
- tenant isolation is tested
- errors are handled
- audit/analytics are implemented where relevant
- automated tests pass
- documentation is updated.
