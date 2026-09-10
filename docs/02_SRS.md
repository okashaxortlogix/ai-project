# Software Requirements Specification

## 1. Functional requirements
FR-001 Authentication and session management.
FR-002 Organization creation and configuration.
FR-003 Organization membership and RBAC.
FR-004 Tenant-aware API authorization.
FR-005 Conversation CRUD and state transitions.
FR-006 Message ingestion and persistence.
FR-007 AI streaming.
FR-008 Agent routing.
FR-009 Knowledge ingestion.
FR-010 Semantic retrieval.
FR-011 Support agent.
FR-012 Sales agent.
FR-013 Appointment agent.
FR-014 Tool execution.
FR-015 Contact/customer management.
FR-016 Lead management.
FR-017 Appointment management.
FR-018 Human handoff.
FR-019 Integration management.
FR-020 Webhook processing.
FR-021 Notifications.
FR-022 Analytics.
FR-023 AI usage tracking.
FR-024 Audit logs.
FR-025 File management.
FR-026 Admin configuration.

## 2. Non-functional requirements
NFR-001 Security: all privileged endpoints require authentication.
NFR-002 Tenant isolation: every tenant-scoped query is organization constrained.
NFR-003 Availability: application should degrade gracefully when AI/provider services fail.
NFR-004 Observability: errors, jobs and important actions are observable.
NFR-005 Maintainability: services are modular and provider-specific logic is isolated.
NFR-006 Scalability: queues separate slow work from interactive requests.
NFR-007 Privacy: secrets are encrypted and private data is access controlled.
NFR-008 Testability: critical business actions have automated tests.

## 3. Error contract
```json
{
  "success": false,
  "error": {
    "code": "APPOINTMENT_PROVIDER_UNAVAILABLE",
    "message": "Appointment service is temporarily unavailable.",
    "request_id": "uuid"
  }
}
```

Never return stack traces or secret values.

## 4. Pagination
All large list endpoints use cursor or page pagination. Default page size should be bounded and configurable.

## 5. Idempotency
Required for:
- appointment creation
- webhook processing
- external CRM creation
- notification dispatch where duplication is harmful.

## 6. Background jobs
Use queues for:
- embeddings
- document parsing
- notifications
- provider synchronization
- analytics aggregation
- retryable external actions.

## 7. Security requirements
- secure password hashing
- HTTPS
- CSRF protection where applicable
- rate limiting
- RBAC
- tenant policies
- secret encryption
- webhook signature verification
- secure uploads
- prompt injection defenses
- audit logs.

## 8. Browser requirements
Responsive modern browsers. The dashboard must remain usable on desktop and tablet; the chat widget must be responsive on mobile.

## 9. API versioning
Use `/api/v1/...` for stable public application endpoints.
