# Technology Stack

## Required
- Frontend: Next.js, React, TypeScript
- Styling/UI: Tailwind CSS, shadcn/ui
- Backend: Laravel, PHP
- Database: MySQL 8.x-compatible production setup
- Cache/queues: Redis
- Queue monitoring: Laravel Horizon
- Vector database: Qdrant
- Reverse proxy: Nginx
- Containers: Docker
- Source control: Git/GitHub

## AI
Use an AI provider abstraction so the application can support:
- OpenAI
- Gemini
- Claude
- compatible/local models.

Optional local inference:
- Ollama
- a suitable local model.

## Storage
S3-compatible object storage in production; local storage for development.

## Testing
- Laravel/PHPUnit or Pest
- Next.js/TypeScript testing tools
- Playwright for E2E
- provider mocks/sandboxes.

## Observability
Sentry or equivalent for errors; application logs plus structured audit logs.

## Why MySQL?
MySQL is the source of truth for transactional relational data. Qdrant handles semantic vector retrieval separately. This separation keeps business queries and AI retrieval responsibilities clean.

## Free vs paid
Frameworks and self-hostable infrastructure can be free/open-source. AI API usage, cloud hosting, storage and third-party provider services may cost money. Local AI can reduce API costs but requires adequate hardware.
