# AI Conversation & Sales Suite — Project Hierarchy

## 1. Product
A multi-tenant AI conversation and sales automation platform with three specialized agents:
- Customer Support Agent
- Sales Agent
- Appointment Agent

## 2. Repository
```text
ai-conversation-sales-suite/
├── frontend/                 # Next.js + React + TypeScript
├── backend/                  # Laravel + PHP
├── infrastructure/           # Docker, Nginx, deployment
├── docs/                     # Product and technical documentation
├── scripts/                  # setup, seed, maintenance scripts
└── tests/                    # cross-system/e2e assets
```

## 3. Frontend hierarchy
```text
frontend/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   │   ├── overview/
│   │   ├── conversations/
│   │   ├── contacts/
│   │   ├── leads/
│   │   ├── appointments/
│   │   ├── knowledge/
│   │   ├── agents/
│   │   ├── integrations/
│   │   ├── analytics/
│   │   ├── team/
│   │   └── settings/
│   └── widget/
├── components/
├── lib/
├── hooks/
├── types/
└── public/
```

## 4. Laravel hierarchy
```text
backend/
├── app/
│   ├── Http/Controllers/Api/
│   ├── Models/
│   ├── Services/
│   │   ├── AI/
│   │   ├── Agents/
│   │   ├── Conversation/
│   │   ├── Knowledge/
│   │   ├── Integrations/
│   │   ├── CRM/
│   │   └── Analytics/
│   ├── Tools/
│   ├── Jobs/
│   ├── Policies/
│   ├── Events/
│   ├── Listeners/
│   └── Support/
├── database/migrations/
├── routes/
├── config/
└── tests/
```

## 5. Infrastructure
```text
infrastructure/
├── docker/
├── nginx/
├── mysql/
├── redis/
├── qdrant/
└── deployment/
```

## 6. Core architectural rule
The LLM never gets unrestricted database or external API access. It can request typed tools. Laravel validates tenant, user/agent permission, input, business rules and provider state before executing the action.
