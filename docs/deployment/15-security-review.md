# 15 Security Review

| Severity | Finding | Reference | Risk | Recommended fix | Blocks production |
| --- | --- | --- | --- | --- | --- |
| High | `xlsx@0.18.5` no-fix advisories | `backend/package.json`, `frontend/package.json` | Prototype pollution/ReDoS on malicious spreadsheets | Accept only trusted files; keep 10MB cap; replace parser before external exposure | Conditional |
| High | Entra ID not configured in Azure yet | Deployment config | Unauthenticated production if proxy not configured | `AUTH_MODE=proxy`; oauth2-proxy; Key Vault secrets | Yes |
| Medium | Some routes still use dynamic update SQL with allowlists but not all route-level validators | `backend/src/routes/*` | Bad data or missed validation on non-core routes | Extend `backend/src/validation.js` pattern | No for controlled UAT |
| Medium | Blob Storage not implemented because current uploads are transient | `backend/src/routes/sap.js` | Future durable files could be lost if stored on VM | Implement Blob client before persistent uploads | No if no persistent uploads |
| Medium | No secret retrieval script from Key Vault yet in app runtime | `deploy/scripts` | Manual env handling risk | Use managed identity and Key Vault in deployment script | Yes |
| Low | Frontend uses localStorage for UX session | `frontend/src/screens/Login.jsx` | Not authoritative, spoofable locally | Backend proxy auth is authoritative; later replace with `/api/me` | No if backend auth remains enforced |

## Positive Controls Present

- Backend security headers and CSP.
- Production config fail-closed for auth.
- Server-side role write authorization.
- Parameterized SQL for user values.
- SAP upload limits and type checks.
- Docker runtime non-root.

