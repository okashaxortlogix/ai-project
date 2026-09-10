# Phase-by-Phase Implementation Plan

## Phase 0 — Requirements freeze
Deliverables:
- approved PRD
- approved MVP
- UI wireframes
- API contract
- ERD.

## Phase 1 — Repositories & infrastructure
- create frontend/backend repos
- Docker Compose
- MySQL
- Redis
- Qdrant
- Nginx
- environment templates
- CI skeleton.

## Phase 2 — Auth & tenancy
- users
- organizations
- membership
- roles
- policies
- tenant middleware
- auth UI/API.

## Phase 3 — Core CRM data
- customers
- leads
- tags/notes
- basic dashboard.

## Phase 4 — Conversation system
- conversations
- messages
- inbox
- widget
- streaming.

## Phase 5 — AI core
- provider adapter
- orchestrator
- prompts
- structured outputs
- usage tracking.

## Phase 6 — RAG
- upload
- extraction
- chunking
- embeddings
- Qdrant
- retrieval
- source tracking.

## Phase 7 — Support Agent
Implement support prompt, routing, knowledge behavior, escalation and tools.

## Phase 8 — Sales Agent
Implement qualification, lead tools, recommendations and next-step logic.

## Phase 9 — Appointment Agent
Implement calendar OAuth, availability, booking, reschedule/cancel and confirmation.

## Phase 10 — Human handoff
Inbox assignment, notifications, takeover, pause/resume.

## Phase 11 — Integrations
Add CRM/notification providers through adapter pattern.

## Phase 12 — Analytics
Dashboards, usage, agent metrics, funnel metrics.

## Phase 13 — Security/QA
Security audit, tenant tests, AI evals, load tests, backup tests.

## Phase 14 — Production
Staging, CI/CD, TLS, monitoring, backups, deployment runbook.

## Rule
Do not start the next phase until the current phase's acceptance tests pass.
