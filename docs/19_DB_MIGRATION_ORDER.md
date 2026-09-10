# Database Migration Order

Create migrations in this dependency order:

1. organizations
2. users
3. organization_user
4. customers
5. agents
6. conversations
7. messages
8. knowledge_documents
9. knowledge_chunks
10. leads
11. appointments
12. integrations
13. integration_credentials
14. tool_executions
15. usage_records
16. notifications
17. audit_logs

Use foreign keys where appropriate. Use soft deletion only where it matches business requirements. Index organization_id and common filters.
