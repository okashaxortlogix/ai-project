# Phase 5 — Full-System Integration, Reliability & Hardening

## Objective
After bugs are remediated and approved missing features are implemented, validate the entire platform as one integrated production system.

Do not treat features as isolated modules.

## Required Architecture Verification
Verify real runtime paths:

Next.js → Laravel API → SQL

Laravel → Redis → Queue Worker

Laravel → Qdrant

Laravel → AI Providers

Laravel → External Integrations

Every important user action must be traced end-to-end.

## 1. Full API Inventory
Enumerate every API route and verify:
- Authentication
- RBAC
- Tenant isolation
- Validation
- Correct HTTP method
- Correct response
- Error handling
- Database persistence
- Tests

Find orphaned frontend calls and unused backend endpoints.

## 2. Full E2E Integration Tests

### CRM
Test:
- Create contact
- Update contact
- Search
- Tags
- Custom fields
- Company relationship
- Opportunity
- Pipeline movement
- Tasks
- Notes
- Activity timeline

### AI
Test:
- User request
- Orchestrator
- Agent routing
- Tool selection
- Tool authorization
- Tool execution
- Database update
- User-visible result

### RAG
Test:
- Upload document
- Parse
- Chunk
- Embed
- Qdrant index
- Retrieve
- AI answer
- Update document
- Delete document

### Workflows
Test:
- Trigger
- Condition
- Action
- Wait
- Queue
- Retry
- Failure
- Execution history

### Appointments
Test:
- Availability
- Booking
- Conflict
- Cancellation
- Rescheduling
- Calendar sync

### Integrations
Test real supported integration flows and failure recovery.

### Webhooks
Test:
- Valid event
- Invalid signature
- Duplicate event
- Malformed payload
- Retry
- Failure

## 3. Failure Testing
Simulate:
- Database unavailable
- Redis unavailable
- Worker stopped
- Qdrant unavailable
- AI provider unavailable
- External provider timeout
- Invalid OAuth
- Network timeout
- Malformed webhook
- Invalid payload
- Duplicate event
- Job failure

The application must fail safely and recover where designed.

## 4. Queue Hardening
Verify:
- Retries
- Backoff
- Failed jobs
- Idempotency
- Duplicate prevention
- Delayed jobs
- Worker restart
- Stale jobs
- Concurrency
- Job observability

## 5. Database Hardening
Check:
- Indexes
- Foreign keys
- Transactions
- N+1 queries
- Slow queries
- Large datasets
- Pagination
- Connection handling
- Race conditions
- Data consistency

## 6. Multi-Tenant Security
Create multiple organizations and verify:
- No cross-tenant reads
- No cross-tenant updates
- No cross-tenant deletes
- No cross-tenant search leakage
- No cross-tenant AI tool execution
- No cross-tenant RAG retrieval
- No cross-tenant files
- No cross-tenant analytics

## 7. RBAC Matrix
Test every role against:
- View
- Create
- Update
- Delete
- Execute
- Export
- Admin operations

Verify backend enforcement independently of frontend restrictions.

## 8. AI Reliability
Test:
- Invalid model output
- Tool hallucination
- Missing parameters
- Unauthorized tool calls
- Provider errors
- Timeouts
- Context overflow
- Ambiguous requests
- Prompt injection attempts
- Sensitive data handling

## 9. RAG Reliability
Verify:
- Retrieval quality
- Tenant isolation
- Metadata filtering
- Failed ingestion
- Qdrant failure
- Stale vectors
- Deleted documents
- Duplicate documents

## 10. Security Hardening
Perform:
- Authentication review
- Authorization review
- IDOR/BOLA review
- Mass assignment review
- Injection review
- File upload review
- Secret exposure review
- CORS review
- CSRF review where applicable
- Rate-limit review
- Audit-log review

## 11. Performance
Measure:
- API response times
- Database query performance
- Queue latency
- AI latency
- RAG latency
- Large-list rendering
- Pagination
- Concurrent requests

Fix high-impact bottlenecks found during testing.

## 12. Observability
Verify:
- Application logs
- Queue logs
- Failed jobs
- Integration errors
- AI failures
- Audit logs
- Useful request correlation identifiers where appropriate

Do not log secrets, tokens, passwords, or sensitive user content unnecessarily.

## 13. Deployment Readiness
Verify:
- Environment variables
- Production configuration
- Database migrations
- Queue worker
- Scheduler
- Redis
- Qdrant
- Frontend build
- Backend build
- Reverse proxy configuration
- Health checks

## 14. Recovery
Verify behavior after:
- Worker restart
- Application restart
- Redis restart
- Temporary DB outage
- Temporary provider outage

Verify no silent data loss.

## Required Deliverable
Create:

`docs/PHASE_5_INTEGRATION_HARDENING.md`

Include:
- Test scenario
- Expected result
- Actual result
- Evidence
- Bugs discovered
- Fixes applied if allowed
- Regression result
- Final status

## Exit Gate
Mark:

**READY FOR PHASE 6**

only when the complete system passes integration and hardening verification.

Otherwise:

**BLOCKED — REMEDIATION REQUIRED**
