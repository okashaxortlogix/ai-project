# API Specification

Base: `/api/v1`

## Auth
POST `/auth/login`
POST `/auth/logout`
GET `/auth/me`

## Organizations
GET `/organizations`
GET `/organizations/{organization}`
PATCH `/organizations/{organization}`

## Conversations
GET `/conversations`
POST `/conversations`
GET `/conversations/{conversation}`
GET `/conversations/{conversation}/messages`
POST `/conversations/{conversation}/messages`
POST `/conversations/{conversation}/handoff`
POST `/conversations/{conversation}/resolve`

## Customers
GET `/customers`
POST `/customers`
GET `/customers/{customer}`
PATCH `/customers/{customer}`

## Leads
GET `/leads`
POST `/leads`
GET `/leads/{lead}`
PATCH `/leads/{lead}`

## Appointments
GET `/appointments`
GET `/appointments/availability`
POST `/appointments`
PATCH `/appointments/{appointment}`
POST `/appointments/{appointment}/cancel`

## Knowledge
GET `/knowledge/documents`
POST `/knowledge/documents`
GET `/knowledge/documents/{document}`
DELETE `/knowledge/documents/{document}`
POST `/knowledge/documents/{document}/reindex`

## Agents
GET `/agents`
GET `/agents/{agent}`
PATCH `/agents/{agent}`

## Integrations
GET `/integrations`
POST `/integrations/{provider}/connect`
DELETE `/integrations/{integration}`
GET `/integrations/{integration}/status`

## Analytics
GET `/analytics/overview`
GET `/analytics/conversations`
GET `/analytics/leads`
GET `/analytics/appointments`
GET `/usage`

## Webhooks
POST `/webhooks/{provider}`

## API rules
- Validate all input.
- Authorize every resource.
- Resolve tenant from authenticated context.
- Paginate collections.
- Return consistent errors.
- Use idempotency keys for retry-sensitive actions.
- Log request IDs.
