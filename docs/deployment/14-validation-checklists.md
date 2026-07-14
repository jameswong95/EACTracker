# 14 Validation Checklists

## Pre-Deployment

- Tests/build passing.
- Frontend and backend dependency audits reviewed.
- Docker images built and tagged immutably.
- Migration reviewed and backward compatible.
- Key Vault secrets present.
- Entra redirect URIs confirmed.
- Current production version recorded.
- Previous rollback image available.
- `/api/ready` reachable in target environment.

## Post-Deployment

- `/api/ready` returns 200.
- `/api/health` returns 200.
- Entra login works.
- Entra logout works.
- Role-based write access works.
- Unauthorized API write returns 401/403.
- Database read/write verified.
- SAP `.xlsx` import preview verified with trusted test file.
- Logs visible in Log Analytics.
- Metrics visible in Azure Monitor.
- Alerts enabled.
- TLS certificate valid.
- Rollback version recorded.

## Entra SSO Tests

- Authorized user.
- Unauthorized user.
- User with no assigned role.
- Missing token/session.
- Wrong tenant.
- Role change.
- Logout.
- Session expiry.
- Direct API access without proxy headers.

