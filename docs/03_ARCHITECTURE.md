# Technical Architecture

## High-level
```text
Browser
  |
  v
Next.js
  |
 HTTPS
  v
Laravel API
  |
  +--> MySQL
  +--> Redis
  +--> Qdrant
  +--> Object Storage
  |
  +--> AI Provider Adapter
  |
  +--> Integration Adapters
          +--> Calendar
          +--> CRM
          +--> Messaging
          +--> Ecommerce
```

## Architectural style
Use a modular monolith initially. Do not create microservices unless scale or ownership boundaries justify them.

## Backend layers
- Controller: HTTP translation only.
- Request: validation.
- Policy: authorization.
- Service: business logic.
- Repository/query layer where useful.
- Tool: AI-callable controlled action.
- Job: asynchronous work.
- Event/listener: decoupled side effects.
- Model: persistence.

## AI provider abstraction
```text
AiProviderInterface
├── generate()
├── stream()
├── embed()
└── estimateUsage()
```
Provider implementations should be swappable.

## Agent abstraction
```text
AgentInterface
├── SupportAgent
├── SalesAgent
└── AppointmentAgent
```

Each agent receives:
- conversation context
- customer context
- retrieved knowledge
- allowed tools
- organization configuration.

## Security boundary
LLM output is untrusted. Tool requests are validated by Laravel before any action.

## Data flow
1. Client sends message.
2. Laravel authenticates/validates.
3. Message is stored.
4. Orchestrator loads context.
5. RAG retrieval runs.
6. Agent invokes model.
7. Tool requests are validated.
8. Tool executes.
9. Result is returned to model.
10. Final response stored and streamed.
11. Usage and audit events are recorded.

## Scaling
- Redis queues for slow tasks.
- Horizontal Laravel workers.
- Read replicas only if needed later.
- Qdrant scaling later if retrieval volume grows.
- Object storage for large files.
