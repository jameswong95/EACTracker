# 01 Current State Assessment

## Concise Assessment

EACTracker is a two-part JavaScript web application:

- Frontend: React 18 SPA built with Vite 8, located in `frontend/`.
- Backend: Node.js 20+ Express 4 API, located in `backend/`.
- Database: PostgreSQL, accessed directly through `pg`; no ORM.
- Deployment today: one root `Dockerfile` builds frontend assets and serves them from the backend container.
- Authentication today: local/demo user selection in the frontend plus production-ready proxy-header authentication middleware in the backend.

The application is close to container deployable, but not yet Azure-production complete. The main deployment blockers are Microsoft Entra ID setup, Azure infrastructure, Docker Compose deployment files, Azure DevOps pipelines, Key Vault secret wiring, monitoring, and a deliberate decision about the remaining `xlsx` advisory.

## Detected Stack

| Area | Detected value |
| --- | --- |
| Frontend framework | React `^18.3.1` |
| Frontend build tool | Vite `^8.1.4` |
| Backend framework | Express `^4.19.2` |
| Languages | JavaScript / JSX / SQL |
| Package managers | npm with `package-lock.json` in `frontend/` and `backend/` |
| Database | PostgreSQL |
| DB access | `pg` Pool in `backend/src/db.js` |
| Migrations | SQL files applied by `backend/scripts/migrate-all.mjs` |
| File upload | `multer` memory storage for SAP Excel uploads in `backend/src/routes/sap.js`; browser-side resource plan import uses `xlsx` |
| Background workers | None detected |
| Queue/cache/email | None detected |
| Health checks | `GET /api/health`, `GET /api/ready` |
| Ports | Frontend dev `5173`; backend/runtime `4000`; production reverse proxy should expose only `80/443` |
| Runtime command | Backend: `npm start`; frontend built by `npm run build` |

## Already Production-Oriented

- Centralized configuration in `backend/src/config.js`.
- Backend fails closed in production unless proxy authentication is configured.
- Security headers, CSP, rate limiting, content-type enforcement, request IDs, and structured security logs in `backend/src/security.js`.
- Server-side validation for core project/cost/resource/material routes.
- DB setup consolidated under `backend/db/`.
- Dockerfile is multi-stage and runs runtime container as non-root.

## Missing Before Azure Deployment

- Entra ID app registrations and role assignments.
- Reverse proxy configuration for TLS and OIDC.
- Docker Compose files for UAT/Production.
- Azure DevOps CI/CD pipelines.
- Bicep infrastructure.
- Key Vault retrieval strategy on the VM.
- Application Insights / Log Analytics agent configuration.
- Blob Storage integration if future durable uploads/attachments are added.
- Production domain/DNS/TLS setup.

## Security Risks And Blockers

| Severity | Issue | Blocks production? | Fix |
| --- | --- | --- | --- |
| High | `xlsx@0.18.5` has no-fix advisories and is used for trusted spreadsheet parsing. | Conditional | Keep uploads trusted/internal, file-size/type limits, and plan replacement before external tenant use. |
| High | Entra ID is not yet configured in Azure. | Yes | Use oauth2-proxy + Entra OIDC in front of app, inject trusted headers to backend. |
| Medium | No Azure Key Vault secret retrieval on VM yet. | Yes | VM deployment scripts read Key Vault via managed identity. |
| Medium | No compose/reverse-proxy production files yet. | Yes | Add `deploy/` scaffolding in this package. |
| Medium | Some non-core routes still need full input allowlist validation. | No for internal UAT; yes before broad rollout | Extend `backend/src/validation.js` patterns route-by-route. |

## Assumptions

- App name for examples: `eactracker`.
- Azure region examples: `southeastasia`; replace if your data residency requires another region.
- One maintainer prefers VM + Docker Compose over Kubernetes.
- The app is internal business software for approximately 200 users and 20-50 initial concurrent users.
- Entra ID is the corporate identity provider.
- The VM is replaceable; database, secrets, container images, and future files live outside it.

