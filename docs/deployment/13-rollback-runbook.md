# 13 Rollback Runbook

## Rollback Scope

Rollback means restoring the previous immutable frontend/backend image tags and recreating containers. It does not roll back database schema automatically.

## Procedure

1. Identify previous successful release file:

```sh
ls -1 /opt/eactracker/releases
cat /opt/eactracker/releases/previous.env
```

2. Run rollback:

```sh
cd /opt/eactracker
./deploy/scripts/rollback.sh prod
```

3. Validate:

```sh
./deploy/scripts/health-check.sh https://app.example.com
./deploy/scripts/smoke-test.sh https://app.example.com
```

4. Record incident and reason.

## When Rollback Is Unsafe

Do not rollback automatically if the failed release applied destructive migrations. Follow the database migration runbook and restore compatibility first.

