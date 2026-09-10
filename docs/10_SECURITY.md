# Security Specification

## Threat model
Threats include:
- cross-tenant data access
- stolen integration credentials
- malicious file uploads
- prompt injection
- tool abuse
- webhook forgery
- account takeover
- excessive API usage
- data leakage through logs.

## Controls
### Tenant isolation
Every query and mutation must be tenant scoped. Add automated tests that attempt cross-tenant access.

### RBAC
Policies enforced server-side.

### Secrets
Encrypt provider credentials at rest. Never log access/refresh tokens.

### Prompt injection
Treat user text and retrieved documents as untrusted. System rules remain authoritative. Tool permissions cannot be granted by content.

### Tool security
Allowlist tools per agent. Validate JSON schema. Enforce tenant and role permissions.

### Webhooks
Verify provider signature and use idempotency.

### Files
Validate MIME, extension and size. Store outside executable web roots. Scan where possible.

### Rate limiting
Limit public chat, auth attempts, webhooks and expensive AI endpoints.

### Logging
Do not log passwords, tokens or unnecessary sensitive content.

### Data deletion
Provide controlled deletion for conversations, customers and documents according to retention policy.

### Audit
Record who/what/when for privileged actions.
