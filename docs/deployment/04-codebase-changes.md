# 04 Codebase Changes

## Existing Repository Shape

```text
/
├── backend/
│   ├── db/
│   ├── scripts/
│   └── src/
├── frontend/
│   └── src/
├── Dockerfile
├── DEPLOYMENT.md
├── SECURITY.md
└── Deploy.md
```

## Proposed Deployment Structure

```text
/
├── backend/
│   ├── Dockerfile
│   └── src/
├── frontend/
│   ├── Dockerfile
│   └── src/
├── deploy/
│   ├── docker-compose.uat.yml
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   │   └── default.conf
│   ├── scripts/
│   │   ├── deploy-compose.sh
│   │   ├── health-check.sh
│   │   ├── smoke-test.sh
│   │   ├── rollback.sh
│   │   └── cleanup-images.sh
│   └── systemd/
│       └── eactracker.service
├── infra/
│   ├── main.bicep
│   ├── modules/
│   └── parameters/
├── pipelines/
│   ├── pull-request.yml
│   ├── build.yml
│   ├── deploy-uat.yml
│   └── deploy-prod.yml
└── docs/deployment/
```

## Files Added By This Deployment Package

| File | Why needed |
| --- | --- |
| `docs/deployment/*.md` | Complete Azure deployment guide and runbooks |
| `backend/Dockerfile` | Dedicated backend runtime image |
| `frontend/Dockerfile` | Dedicated static frontend image |
| `deploy/docker-compose.*.yml` | VM deployment runtime definition |
| `deploy/nginx/default.conf` | Reverse proxy and auth boundary |
| `deploy/scripts/*.sh` | Deployment, smoke test, rollback, cleanup |
| `infra/*.bicep` | Azure infrastructure as code starter |
| `pipelines/*.yml` | Azure DevOps CI/CD starter |

## Values Never To Commit

- `DATABASE_URL`
- `AUTH_PROXY_SECRET`
- oauth2-proxy client secret and cookie secret
- PostgreSQL admin password
- Azure service principal secrets
- Storage access keys
- Real Entra tenant/client IDs if your organisation treats them as confidential

Use Key Vault for secrets and pipeline secret variables only for bootstrapping.

