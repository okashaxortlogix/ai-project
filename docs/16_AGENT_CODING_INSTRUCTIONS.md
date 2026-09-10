# Instructions for an AI Coding Agent

## Mission
Build the AI Conversation & Sales Suite described in this documentation as production-quality software.

## Mandatory reading order
1. 00_PROJECT_HIERARCHY.md
2. 01_DETAILED_PRD.md
3. 02_SRS.md
4. 03_ARCHITECTURE.md
5. 04_TECH_STACK.md
6. 05_ERD.md
7. 06_API_SPEC.md
8. 07_AI_AGENT_SPEC.md
9. 08_RAG_KNOWLEDGE_BASE.md
10. 09_INTEGRATIONS.md
11. 10_SECURITY.md
12. 11_TESTING_PLAN.md
13. 12_PHASE_BY_PHASE_IMPLEMENTATION.md
14. 14_ACCEPTANCE_CRITERIA.md
15. 15_IMPLEMENTATION_CHECKLIST.md

## Implementation rules
- Do not invent conflicting architecture.
- Use Next.js + TypeScript for frontend.
- Use Laravel/PHP for backend.
- Use MySQL for relational data.
- Use Redis for cache/queues.
- Use Qdrant for vector retrieval.
- Keep provider integrations behind interfaces.
- Keep AI tool calls server-controlled.
- Never bypass tenant authorization.
- Never expose secrets to frontend.
- Prefer simple maintainable code over premature microservices.
- Write tests alongside critical features.
- Update documentation when behavior changes.

## Build order
Follow the phase plan. At the end of each phase:
1. run tests
2. inspect migrations
3. verify tenant isolation
4. verify API contracts
5. update checklist
6. document known limitations.

## Never
- hardcode secrets
- trust organization_id from untrusted client input
- let the model execute arbitrary SQL
- let the model call arbitrary URLs
- claim external action success without provider confirmation
- store raw provider tokens in logs
- silently ignore failed jobs.

## Coding style
Use clear naming, small services, typed DTOs/data structures where appropriate, validation, policies and meaningful error codes.
