# Integration Specification

## Integration architecture
Every provider implements a common interface. Core application code calls the interface, not vendor-specific SDK details.

## OAuth
Store:
- provider
- external account ID
- scopes
- access token encrypted
- refresh token encrypted
- expiration.

Never send tokens to the frontend.

## Calendar
Required operations:
- connect
- list calendars
- get availability
- create event
- update event
- delete/cancel event.

## CRM
Required operations:
- search contact
- create/update contact
- create/update lead/opportunity
- optionally add note/activity.

## Webhooks
For every webhook:
1. read raw payload
2. verify signature
3. identify provider/account
4. check idempotency
5. map event
6. update local state
7. enqueue side effects.

## Provider failure
External failures should be converted into stable internal error codes.

## First recommended integration
Google Calendar because it demonstrates OAuth, live availability, booking and webhooks without making the entire product dependent on one CRM.
