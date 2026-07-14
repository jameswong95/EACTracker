# 05 Containerisation

## Container Model

Use three runtime containers:

1. `frontend`: serves Vite build output using Nginx.
2. `backend`: runs Express API on port `4000`, internal network only.
3. `reverse-proxy`: public `80/443`, routes `/api` to backend and all other paths to frontend.

For Entra OIDC, add `oauth2-proxy` as a fourth container in compose. The reverse proxy protects both frontend and backend through auth subrequests.

## Build Commands

```sh
docker build -f frontend/Dockerfile -t acreactracker.azurecr.io/eactracker-frontend:<tag> .
docker build -f backend/Dockerfile -t acreactracker.azurecr.io/eactracker-backend:<tag> .
```

Use immutable tags:

```text
<yyyyMMdd>.<buildId>-<shortSha>
```

Do not deploy `latest`.

## Runtime Requirements

- Backend container needs `NODE_ENV=production`, `DATABASE_URL`, `AUTH_MODE=proxy`, `AUTH_PROXY_SECRET`, optional DB SSL settings.
- Frontend container needs no secrets. Non-secret public config can be baked at build time or served via `/config.json` if you add runtime config later.
- Reverse proxy and oauth2-proxy need Entra client ID, client secret, tenant issuer, cookie secret, and backend proxy shared secret from Key Vault.

## Persistent Storage

No production business data should live in Docker volumes. Use:

- PostgreSQL Flexible Server for data.
- Blob Storage for future durable uploads/generated reports.
- A small host directory only for deployment metadata such as previous image tags.

## Local Container Test

```sh
docker compose -f deploy/docker-compose.uat.yml config
docker compose -f deploy/docker-compose.uat.yml up -d
curl -fsS http://localhost/api/ready
```

