# AI Orchestration Bug Report

## Bug Catalog & Remediation Status

| Bug ID | Severity | Feature Area | Description | Root Cause | Fix Applied | Status |
|--------|----------|--------------|-------------|------------|-------------|--------|
| **AI-BUG-010** | **CRITICAL** | Entity Extraction | "Create a contact named Ali Khan" created "d Ali" | Regex substring collision matching `name` inside `named` | Built `AgentRouter::extractContactCreationData()` with word-boundary awareness | ✅ FIXED |
| **AI-BUG-011** | **CRITICAL** | Tool Routing | Opportunity search triggered unrequested `create_opportunity` in multi-intent | Single-intent parsing collapsed compound query into first matched action | Implemented `AgentRouter::detectMultiIntents()` for sequential sub-intent routing | ✅ FIXED |
| **AI-BUG-012** | **CRITICAL** | Response Quality | "What opportunities does Muhammad Okasha have?" returned generic assistant fallback | Missing `case 'OPPORTUNITY_SEARCH'` in `executeDeterministicFlow` | Added `OPPORTUNITY_SEARCH` flow calling `search_opportunities` | ✅ FIXED |
| **AI-BUG-013** | **HIGH** | Contact Search | Contact search truncated 7 database records to 5 | Hardcoded `array_slice($list, 0, 5)` in orchestrator | Removed slice, rendered all returned records with ID badges | ✅ FIXED |
| **AI-BUG-014** | **HIGH** | Lead Lookup | "Find all leads from this company" dropped to generic assistant text | Missing company leads handler and prompt clarification flow | Implemented `COMPANY_LEADS` intent and `search_leads` tool | ✅ FIXED |
| **AI-BUG-015** | **HIGH** | Context Resolution | "Summarize this customer's conversation" gave generic fallback | Missing conversation summary tool and active session resolution | Implemented `CONVERSATION_SUMMARY` and `summarize_conversation` tool | ✅ FIXED |
| **AI-BUG-016** | **MEDIUM** | Contact Management | Repeated seeds created 7 duplicate contact rows with same email | Lack of tenant email uniqueness check in `createContact` | Added deduplication check to update existing contact if matching email exists | ✅ FIXED |
| **AI-BUG-017** | **MEDIUM** | API Contract | `conversation_id` snake_case parameter was ignored by `AiChatController` | Validation only checked `conversationId` camelCase | Updated controller to accept both `conversationId` and `conversation_id` | ✅ FIXED |

---

## Detailed Bug Forensics

### AI-BUG-010: The "d Ali" Contact Extraction Bug
- **Severity**: CRITICAL
- **Component**: `LlmOrchestratorService.php` / `AgentRouter.php`
- **Mechanism**: The regex `/name\s*(?:is|:)?\s*([A-Za-z]+)\s+([A-Za-z]+)/i` evaluated `"Create a contact named Ali Khan."`. The substring `name` matched the start of `named`. The leftover letter `d` matched `([A-Za-z]+)`, and `Ali` matched the second group, completely losing `"Khan"`.
- **Solution**: A dedicated tokenizer strips leading command phrases (`create a contact named`, `add lead`, etc.), extracts emails and phone numbers first, and cleanly parses name tokens.
- **Verification**: Tested on `"Ali Khan"` -> `first: "Ali"`, `last: "Khan"`; `"Ahmed Raza"` -> `first: "Ahmed"`, `last: "Raza"`; `"John Smith"` -> `first: "John"`, `last: "Smith"`; `"Muhammad Ali Khan"` -> `first: "Muhammad Ali"`, `last: "Khan"`.

### AI-BUG-011: Multi-Intent Collapse & False Action Creation
- **Severity**: CRITICAL
- **Component**: `LlmOrchestratorService.php` / `AgentRouter.php`
- **Mechanism**: Single regex matching evaluated the whole prompt as one intent. If words from multiple intents appeared, the first match was chosen. In some cases, opportunity intent without search handling mistakenly triggered `create_opportunity`.
- **Solution**: `AgentRouter::detectMultiIntents()` splits the prompt by punctuation and conjunction boundaries. When 2 or more distinct intents are found, each sub-query executes its corresponding tool.
- **Verification**: `"What opportunities does Muhammad Okasha have? Create a task for Muhammad Okasha."` executes `search_opportunities` and `create_task`, producing both results without invoking `create_opportunity`.

### AI-BUG-012: Opportunity Search Generic Fallback
- **Severity**: CRITICAL
- **Component**: `LlmOrchestratorService.php`
- **Mechanism**: `AgentRouter` returned `OPPORTUNITY_SEARCH`, but `switch ($intent)` in `executeDeterministicFlow` lacked a case for it, falling to `default:` which returned the generic assistant greeting.
- **Solution**: Implemented `case 'OPPORTUNITY_SEARCH'`, resolved target contact name via `AgentRouter::extractTargetName()`, queried `ToolRegistry::searchOpportunities()`, and formatted stage, title, and value.
- **Verification**: Verified via API test returning explicit pipeline records or truthful zero-result notification.
