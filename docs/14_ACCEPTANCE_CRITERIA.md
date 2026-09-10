# Acceptance Criteria

## Platform
- Organization can be created.
- Users can be invited/assigned roles.
- Tenant isolation tests pass.

## Chat
- Visitor can start chat.
- Messages persist.
- Streaming works where supported.
- Conversation can be handed to a human.

## AI
- Correct agent is selected for common intents.
- Unknown information is not fabricated.
- AI usage is recorded.

## RAG
- Document indexes successfully.
- Search is tenant filtered.
- Deleted document no longer supplies answers.

## Sales
- Lead can be created and updated.
- Required fields are validated.
- External CRM IDs are stored when synchronized.

## Appointment
- Real availability is checked.
- Booking confirmation is based on provider response.
- Duplicate bookings are prevented as far as provider allows.

## Security
- Unauthorized users receive 401/403 as appropriate.
- Cross-tenant requests cannot access records.
- Secrets do not appear in logs.

## Production
- Health checks work.
- Queue workers are monitored.
- Backups and restoration procedure are documented.
