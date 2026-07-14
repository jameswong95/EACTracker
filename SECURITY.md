# Security Hardening Notes

This project is hardened against the OWASP Top 10:2025 categories with the controls below.

## Implemented Controls

- A01 Broken Access Control: production requires proxy authentication, all API routes require an authenticated identity, and write routes are role-authorized server-side.
- A02 Security Misconfiguration: production fails closed for auth config, security headers/CSP are centralized, JSON/upload sizes are capped, and the Docker image runs as a non-root user.
- A03 Software Supply Chain Failures: `security:audit` scripts are available for backend and frontend dependency checks.
- A04 Cryptographic Failures: production proxy auth uses a shared secret compared with `timingSafeEqual`; database SSL can be required with `DATABASE_SSL=1`.
- A05 Injection: high-risk routes use positive server-side validation and parameterized SQL; file imports are extension/type/size checked.
- A06 Insecure Design: demo authentication is development-only; production authentication must be provided by SSO/reverse proxy.
- A07 Authentication Failures: production blocks demo auth and requires authenticated proxy identity claims.
- A08 Software or Data Integrity Failures: DB migrations are consolidated and repeatable; audits should run before deployment.
- A09 Security Logging and Alerting Failures: auth, authorization, validation, rate-limit, 404, and exception events emit structured JSON logs with request IDs.
- A10 Mishandling of Exceptional Conditions: production error responses avoid stack traces and include request IDs for support correlation.

## Required Production Boundary

Run the app behind an authenticated reverse proxy or SSO gateway. The proxy must strip inbound client-supplied auth headers and inject trusted identity headers plus `AUTH_PROXY_SECRET`.

## Known Residual Risk

`xlsx@0.18.5` is still required for SAP and resource-plan spreadsheet parsing and npm currently reports high-severity advisories with no patched version available. Compensating controls are in place:

- SAP uploads are authenticated and restricted to `Admin`/`Finance`.
- Uploads are memory-only, size-limited, one-file-only, and spreadsheet extension/MIME checked.
- SAP parsing has a row-count cap.
- Browser-side resource imports are size/extension checked before parsing and should be limited to trusted internal files.

Replace `xlsx` with a maintained parser before exposing spreadsheet import to untrusted users or external tenants.
