# 16 Go-Live Checklist

## Must Be Complete

- UAT deployment succeeded with immutable image tags.
- Production Entra app registration created.
- Production users/groups assigned app roles.
- Production Key Vault secrets populated.
- Production DB migrated.
- Production VM has managed identity and AcrPull/Key Vault permissions.
- HTTPS certificate active.
- DNS points to production public endpoint.
- `AUTH_MODE=proxy` configured.
- `AUTH_PROXY_SECRET` matches reverse proxy and backend.
- `ALLOW_DEMO_AUTH` unset in production.
- Monitoring alerts enabled.
- Rollback tested in UAT.

## Final Smoke Test

```sh
curl -fsS https://app.example.com/api/ready
curl -fsS https://app.example.com/api/health
```

Then verify in browser:

- Login.
- Portfolio loads.
- Project detail loads.
- Role-restricted action succeeds for authorised user.
- Same action fails for unauthorised user.
- SAP `.xlsx` preview works for trusted sample.

## Go / No-Go

No-go if:

- Entra roles are missing.
- DB migrations fail.
- Health check fails.
- TLS invalid.
- Backend logs repeated auth failures for normal login.
- Rollback image is unknown.

