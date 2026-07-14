# 09 Database And Storage

## Database Choice

Use Azure Database for PostgreSQL Flexible Server because the backend uses `pg` and SQL migrations.

## Migration Process

Run migrations from the backend image during deployment:

```sh
docker compose run --rm backend npm run db:deploy
```

Rollback-safe migration rule:

1. Add new tables/columns first.
2. Deploy app code compatible with old and new schema.
3. Backfill data separately if needed.
4. Drop old structures in a later approved release.

Do not run destructive migrations automatically.

## Starting Configuration

- UAT: Burstable tier acceptable.
- Production: General Purpose small SKU to start.
- TLS required.
- Public access disabled where private networking is available.
- DB user should have only required database permissions, not superuser.
- Separate UAT and Production servers/databases.

## Blob Storage

Current SAP uploads are parsed in memory and not retained. Future attachments/generated reports should use Blob Storage:

- Containers: `uploads`, `reports`, `exports`
- Access: private only
- Auth: Managed Identity with `Storage Blob Data Contributor`
- Download: short-lived SAS only if direct browser download is required
- Metadata: store blob name, content type, size, checksum, uploaded_by, created_at in PostgreSQL
- Validation: file size, extension, content type, malware scanning recommendation through Defender for Storage

