# ERD — MySQL Data Model

## Core relationships
```text
organizations
  ├──< organization_user >── users
  ├──< customers
  │      ├──< conversations ──< messages
  │      ├──< leads
  │      └──< appointments
  ├──< agents
  ├──< knowledge_documents ──< knowledge_chunks
  ├──< integrations ──< integration_credentials
  ├──< tool_executions
  ├──< usage_records
  ├──< notifications
  └──< audit_logs
```

## organizations
id, name, slug, timezone, business_hours_json, settings_json, status, created_at, updated_at

## users
id, name, email, password_hash, status, created_at, updated_at

## organization_user
id, organization_id, user_id, role, created_at, updated_at
Unique: organization_id + user_id

## customers
id, organization_id, name, email, phone, external_ids_json, metadata_json, created_at, updated_at

## conversations
id, organization_id, customer_id, channel, status, assigned_user_id, active_agent_id, external_thread_id, metadata_json, started_at, last_message_at, resolved_at

## messages
id, organization_id, conversation_id, sender_type, sender_id, content, content_type, metadata_json, model, input_tokens, output_tokens, latency_ms, status, created_at

## agents
id, organization_id, type, name, enabled, system_prompt, configuration_json, escalation_rules_json, created_at, updated_at

## knowledge_documents
id, organization_id, title, source_type, storage_path, mime_type, status, checksum, metadata_json, created_by, created_at, updated_at

## knowledge_chunks
id, organization_id, document_id, chunk_index, text, vector_point_id, metadata_json, status, created_at

## leads
id, organization_id, customer_id, owner_user_id, stage, source, score, qualification_json, notes, external_ids_json, created_at, updated_at

## appointments
id, organization_id, customer_id, lead_id, provider, external_event_id, service, start_at, end_at, timezone, status, metadata_json, created_at, updated_at

## integrations
id, organization_id, provider, type, external_account_id, status, scopes_json, configuration_json, created_at, updated_at

## integration_credentials
id, integration_id, encrypted_access_token, encrypted_refresh_token, expires_at, metadata_json, created_at, updated_at

## tool_executions
id, organization_id, conversation_id, agent_id, tool_name, input_json, output_json, status, error_code, latency_ms, created_at

## usage_records
id, organization_id, conversation_id, provider, model, input_tokens, output_tokens, estimated_cost, request_type, created_at

## audit_logs
id, organization_id, actor_type, actor_id, action, entity_type, entity_id, metadata_json, ip_address, created_at

## notifications
id, organization_id, type, recipient_type, recipient_id, payload_json, status, provider_message_id, sent_at, created_at

## indexes
Every organization-scoped table should have organization_id indexes. Add composite indexes for common filters such as:
- conversations(organization_id, status, last_message_at)
- messages(conversation_id, created_at)
- leads(organization_id, stage, created_at)
- appointments(organization_id, start_at, status)
- knowledge_chunks(organization_id, document_id).
