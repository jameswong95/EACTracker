# Database Setup

This folder is the deployable database source of truth.

## Layout

- `schema.sql` is the idempotent baseline schema.
- `migrations/` contains numbered idempotent migrations applied after the baseline.
- `seed/demo.sql` is demo/sample data only. Do not run it for production deployments.

## Commands

Run these from `backend/`:

```sh
npm run db:deploy
```

Applies `schema.sql`, then every `migrations/migrate-###-*.sql` file in deterministic order.

```sh
npm run migrate:list
```

Prints the exact SQL files that will run.

```sh
npm run db:setup:demo
```

Applies schema and migrations, then loads demo data for local development.

## Environment

Set `DATABASE_URL` in the deployment environment. The local fallback is only for developer machines.
