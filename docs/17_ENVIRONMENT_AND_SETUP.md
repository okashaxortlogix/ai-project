# Environment & Setup Guide

## Prerequisites
- Git
- Docker Desktop
- Node.js compatible with selected Next.js version
- PHP version compatible with selected Laravel version
- Composer
- MySQL
- Redis
- Qdrant
- optional AI provider key or local Ollama installation.

## Local services
```text
frontend: 3000
backend: 8000
mysql: 3306
redis: 6379
qdrant: 6333
```

## Setup sequence
1. Clone repositories.
2. Copy environment examples.
3. Start Docker services.
4. Install frontend dependencies.
5. Install Composer dependencies.
6. Run Laravel migrations.
7. Seed development data.
8. Start queue workers.
9. Start frontend.
10. Open dashboard and widget.
11. Run automated tests.

## Development seed
Create:
- demo organization
- admin user
- sample agent configuration
- sample knowledge document
- sample customer
- sample lead
- sample conversation.

Use fake credentials only.
