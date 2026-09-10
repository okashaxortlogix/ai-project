# AI Conversation & Sales Suite — Implementation Pack

## What this package is
This is an implementation-oriented documentation pack for building the complete AI Conversation & Sales Suite.

## Start here
1. Read `docs/AI_Conversation_Sales_Suite_Complete_PRD_35-40_Pages.pdf`
2. Give `docs/16_AGENT_CODING_INSTRUCTIONS.md` to the coding agent.
3. Have the coding agent read the remaining markdown files before implementation.
4. Implement strictly phase-by-phase using `docs/12_PHASE_BY_PHASE_IMPLEMENTATION.md`.
5. Use `docs/14_ACCEPTANCE_CRITERIA.md` as the release gate.

## Stack
Next.js + React + TypeScript
Laravel + PHP
MySQL
Redis
Qdrant
Docker
Nginx
AI provider abstraction
Optional Ollama/local model

## Important architecture rule
The AI model never gets unrestricted database or external API access. It can request typed backend tools; Laravel validates and executes them.

## Included
- Detailed PRD PDF
- Project hierarchy
- SRS
- Architecture
- Tech stack
- MySQL ERD
- API specification
- AI agent specification
- RAG specification
- Integration specification
- Security specification
- Testing plan
- Phase-by-phase implementation plan
- Acceptance criteria
- Master checklist
- Coding-agent instructions
- Environment/setup guide
- Prompt/policy library
- Migration order
- UI screen specification
