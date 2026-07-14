# Production Deployment

This app can deploy as a single Node service: the backend serves `/api/*` and the built frontend from `frontend/dist`.

## Required Environment

Set these for production:

```sh
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://...
AUTH_MODE=proxy
AUTH_PROXY_SECRET=<long-random-shared-secret>
```

Use these when needed:

```sh
DATABASE_SSL=1
CORS_ORIGIN=https://app.example.com
TRUST_PROXY=1
```

`CORS_ORIGIN` can stay blank when the backend serves the frontend from the same origin.

## Authentication And Access Control

Production fails closed unless `AUTH_MODE=proxy` and `AUTH_PROXY_SECRET` are set. Put the Node service behind an authenticated reverse proxy / SSO gateway. The proxy must remove any client-supplied auth headers and inject:

```txt
x-auth-proxy-secret: <AUTH_PROXY_SECRET>
x-auth-user-id: <numeric users.id>
x-auth-username: <username/email>
x-auth-role: Admin | Project Manager | Project Director | Leader | Finance
```

State-changing API requests are then authorized server-side by role. Unknown write routes default to `Admin` only.

The current app still supports demo/passwordless sign-in for local development. It is blocked when `NODE_ENV=production`.

For a controlled internal/demo deployment only, do not set `NODE_ENV=production`; then use:

```sh
ALLOW_DEMO_AUTH=1
```

For a real production launch, use SSO/proxy authentication and keep `ALLOW_DEMO_AUTH` unset.

## Database

Run from `backend/`:

```sh
npm run db:deploy
```

This applies `backend/db/schema.sql`, then all numbered files in `backend/db/migrations`.

For local/demo data only:

```sh
npm run db:setup:demo
```

## Build And Start Without Docker

```sh
cd frontend
npm ci
npm run build

cd ../backend
npm ci --omit=dev
npm run db:deploy
npm start
```

## Docker

```sh
docker build -t eac-tracker .
docker run --rm -p 4000:4000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgres://... \
  eac-tracker
```

Health checks:

- `GET /api/health`
- `GET /api/ready`

## Pre-Deploy Checks

```sh
cd backend
npm run migrate:list
npm run security:audit

cd ../frontend
npm run build
npm run security:audit
```

## Security Controls

- Security headers and CSP are sent by the Node server.
- API requests are rate-limited per client IP.
- JSON bodies and SAP uploads have size limits.
- SAP uploads accept only Excel/CSV spreadsheet extensions and MIME types.
- Authentication, authorization, validation failures, 404s, and exceptions emit structured JSON security events to stdout/stderr for collection by the host platform.
