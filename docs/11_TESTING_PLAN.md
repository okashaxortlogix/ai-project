# Testing & QA Plan

## Unit
- services
- policies
- validators
- tool schemas
- state transitions
- chunking
- provider adapters.

## API
- auth
- RBAC
- tenant isolation
- CRUD
- pagination
- errors
- idempotency.

## AI evaluation
Test:
- routing
- factuality
- hallucination resistance
- RAG grounding
- tool selection
- tool argument correctness
- escalation
- prompt injection.

## E2E
Scenario:
1. Create organization.
2. Create admin.
3. Configure agent.
4. Upload knowledge.
5. Open widget.
6. Ask support question.
7. Ask sales question.
8. Create lead.
9. Ask for appointment.
10. Book appointment.
11. Request human.
12. Verify analytics/audit.

## Load
Test concurrent chat sessions, queue throughput, webhook bursts and database performance.

## Release gate
No critical security issue, no cross-tenant leakage, no unhandled booking-success false positives, and all critical E2E tests passing.
