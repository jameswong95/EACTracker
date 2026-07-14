# 06 Microsoft Entra SSO

## Chosen Integration

Use Microsoft Entra ID via OIDC at the reverse-proxy boundary with `oauth2-proxy`.

Reason: the current app is a same-origin React SPA plus Express API with demo local session. The backend already supports trusted proxy identity headers through `AUTH_MODE=proxy`. Using oauth2-proxy preserves working behaviour, avoids browser token storage, and keeps maintenance simple for one developer.

If your organisation requires SPA-held access tokens, replace this with MSAL React + backend JWT validation later. Do not do both at the same time.

## App Registration

Create separate app registrations for UAT and Production.

### UAT

- Display name: `EACTracker UAT`
- Supported accounts: single tenant
- Redirect URI: `https://uat.example.com/oauth2/callback`
- Front-channel logout URL: `https://uat.example.com/oauth2/sign_out`
- Client secret: store only in Key Vault as `oauth2-client-secret`
- Optional claims: `email`, `preferred_username`, `groups` if group-based assignment is used

### Production

- Display name: `EACTracker Production`
- Redirect URI: `https://app.example.com/oauth2/callback`
- Front-channel logout URL: `https://app.example.com/oauth2/sign_out`
- Same claims and roles as UAT.

## App Roles

Map to the roles currently present in the code:

- `Admin`
- `Leader`
- `Finance`
- `Project Director`
- `Project Manager`

The backend accepts exactly these roles in `backend/src/security.js`. Frontend role visibility is user-experience only; backend write authorization is authoritative.

## oauth2-proxy Environment

```env
OAUTH2_PROXY_PROVIDER=oidc
OAUTH2_PROXY_OIDC_ISSUER_URL=https://login.microsoftonline.com/<tenant-id>/v2.0
OAUTH2_PROXY_CLIENT_ID=<app-registration-client-id>
OAUTH2_PROXY_CLIENT_SECRET=<from-key-vault>
OAUTH2_PROXY_COOKIE_SECRET=<32-byte-base64-secret>
OAUTH2_PROXY_EMAIL_DOMAINS=*
OAUTH2_PROXY_SCOPE=openid profile email
OAUTH2_PROXY_SET_XAUTHREQUEST=true
OAUTH2_PROXY_PASS_AUTHORIZATION_HEADER=false
OAUTH2_PROXY_PASS_ACCESS_TOKEN=false
```

## Header Mapping To Backend

The reverse proxy must strip any inbound client-supplied identity headers, then inject:

```text
x-auth-proxy-secret: <AUTH_PROXY_SECRET>
x-auth-user-id: <mapped users.id or stable numeric mapping>
x-auth-username: <email or preferred_username>
x-auth-role: <one of the app roles>
```

Important implementation note: Entra role claims are strings but the current backend expects numeric `users.id`. For first production, maintain a `users` row for each Entra user and map by email in the proxy or add a backend `/api/me` resolver in a later code change. Do not trust frontend-local storage as identity.

## Troubleshooting

- Missing role claim: verify Enterprise Application user/group assignment and app role assignment.
- Redirect mismatch: verify exact HTTPS URI including `/oauth2/callback`.
- 401 from backend: verify `AUTH_PROXY_SECRET` matches reverse proxy secret.
- 403 on writes: role not included in backend allowed role list for that endpoint.

