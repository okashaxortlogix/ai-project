# AI Real-World Regression Audit

## Executive Summary
This document provides the complete forensic post-mortem and audit record for the real-world browser and API testing failures discovered in the Nexa AI Suite. The audit investigates why previous synthetic tests gave false confidence, dissects the root causes of the 7 real-world failure scenarios (Test Cases A through G), and establishes systemic safeguards against regressions.

---

## 1. Failure Forensics & Root Cause Analyses

### Test A — Greeting Isolation
- **Observed Behavior**: The AI system responded to "hello" with generic fallback phrases that referenced unexecuted tasks or default assistant help menus.
- **Root Cause**: `AgentRouter` classified `"hello"` as `GREETING`, but the downstream handler lacked dedicated greeting synthesis and fell through to a generic business assistant fallback.
- **Remediation**: Hardcoded clean greeting logic returning a concise, natural response without invoking tools or mutating state.

### Test B — Contact Search & Duplicate Handling
- **Observed Behavior**: A query for `"Find Muhammad Okasha in contacts"` resulted in 7 identical records in the database, while the AI previously truncated the display at 5 items (`array_slice($list, 0, 5)`).
- **Root Cause**: 
  1. Automated test runs seeded contacts repeatedly with random UUID primary keys and the same name/email without tenant-level uniqueness/deduplication checks.
  2. The LLM orchestrator hardcoded a 5-item slice, creating discrepancy between the reported count (7) and displayed records (5).
- **Remediation**:
  1. Implemented contact deduplication in `ToolRegistry::createContact` so matching emails update existing records rather than creating redundant rows.
  2. Removed artificial 5-item slicing in `LlmOrchestratorService`.
  3. Added distinct UUID prefix badges (`[ID: ...]`) in contact search listings when identical names exist.

### Test C — Entity Extraction Malformation (The "d Ali" Bug)
- **Observed Behavior**: User command `"Create a contact named Ali Khan."` resulted in a database contact with `first_name = "d"` and `last_name = "Ali"`.
- **Root Cause**: In `LlmOrchestratorService.php`, the regex `/name\s*(?:is|:)?\s*([A-Za-z]+)\s+([A-Za-z]+)/i` matched the substring `name` inside the word `named`. The trailing letter `d` was captured as group 1 (`first_name`) and `Ali` as group 2 (`last_name`).
- **Remediation**: Developed `AgentRouter::extractContactCreationData()` with word-boundary awareness, non-destructive token stripping, and compound name support (handling "Ali Khan", "Ahmed Raza", "John Smith", and "Muhammad Ali Khan").

### Test D — Multi-Intent Destruction & Unrequested Tool Calls
- **Observed Behavior**: User submitted compound inquiry: `"What opportunities does Muhammad Okasha have? Create a task for Muhammad Okasha."` The system only recognized one intent and executed an unrequested `create_opportunity`.
- **Root Cause**: The orchestrator evaluated user prompts as single atomic intents. The keyword `"opportunities"` matched before `"task"`, and missing search handlers caused erroneous opportunity generation.
- **Remediation**: Implemented `AgentRouter::detectMultiIntents()`. Compound messages are decomposed into discrete sub-intents (`OPPORTUNITY_SEARCH` and `TASK_CREATE`). Each is resolved and executed sequentially, populating `tools_executed` and returning composite factual results with zero unrequested tool execution.

### Test E — Opportunity Lookup Generic Fallback
- **Observed Behavior**: User asked `"What opportunities does Muhammad Okasha have?"` The system returned generic assistant boilerplate: *"I am your AI Business Assistant..."*
- **Root Cause**: `AgentRouter` detected `OPPORTUNITY_SEARCH`, but `LlmOrchestratorService::executeDeterministicFlow` did not contain a `case 'OPPORTUNITY_SEARCH'`, dropping straight to the `default:` fallback.
- **Remediation**: Added `case 'OPPORTUNITY_SEARCH'` to `executeDeterministicFlow` and upgraded `ToolRegistry::searchOpportunities` with `contact_name` filtering and eager-loaded pipelines.

### Test F — Company Lead Search & Context Resolution
- **Observed Behavior**: Query `"Find all leads from this company"` yielded generic assistant boilerplate.
- **Root Cause**: No intent or context resolver existed for company-scoped lead lookups.
- **Remediation**: Created `COMPANY_LEADS` intent and `search_leads` / `get_company_leads` tools. Added conversational context resolution: if active company is missing from context, AI explicitly prompts: *"Which company would you like me to search?"*

### Test G — Conversation Summarization
- **Observed Behavior**: Query `"Summarize this customer's conversation"` returned generic assistant boilerplate.
- **Root Cause**: Missing `CONVERSATION_SUMMARY` handler and no tool to extract transcript history from `messages` table.
- **Remediation**: Added `CONVERSATION_SUMMARY` intent and `summarize_conversation` tool. If called without a conversation, prompts the user to select or specify a conversation. If called with an active conversation, reads actual messages and builds a factual recap.

---

## 2. Component Inventory & Audit Results

| Component | File Path | Status | Verification Check |
|-----------|-----------|--------|---------------------|
| Intent Classifier & Router | `backend/app/Services/Agents/AgentRouter.php` | ✅ VERIFIED | 22 Intents + Multi-Intent detection |
| Entity Extractor | `backend/app/Services/Agents/AgentRouter.php` | ✅ VERIFIED | Clean parsing of compound names, emails, phones |
| CRM Tools Engine | `backend/app/Tools/ToolRegistry.php` | ✅ VERIFIED | 25 tools with multi-tenant isolation |
| AI Orchestrator | `backend/app/Services/AI/LlmOrchestratorService.php` | ✅ VERIFIED | Zero-hallucination deterministic flow |
| Chat API Controller | `backend/app/Http/Controllers/Api/AiChatController.php` | ✅ VERIFIED | Sanctum auth + snake/camelCase param support |
| Frontend Chat UI | `frontend/components/ScreenAIAssistant.tsx` | ✅ VERIFIED | Dynamic multi-tool badges & action plans |
