# Deployment Specification

## Local
Docker Compose:
- frontend
- backend
- mysql
- redis
- qdrant
- nginx.

## Environment variables
```env
APP_ENV=local
APP_URL=
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
REDIS_HOST=redis
QDRANT_URL=
AI_PROVIDER=
AI_API_KEY=
STORAGE_DRIVER=
```

Never commit real secrets.

## Production
Recommended:
- Linux server/cloud
- Docker
- Nginx
- TLS
- MySQL backups
- Redis persistence according to workload
- Qdrant persistent volume
- object storage
- monitoring.

## CI/CD
Pipeline:
```text
push → lint → unit tests → API tests → frontend tests → build → security checks → deploy staging
```
Production deployment should require an explicit release step.

## Backups
Back up MySQL and Qdrant according to business recovery objectives. Test restoration rather than assuming backups work.
