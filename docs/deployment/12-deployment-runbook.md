# 12 Deployment Runbook

## Normal Deployment

1. Confirm PR validation passes.
2. Confirm migration diff is reviewed.
3. Build immutable images with Azure DevOps.
4. Record current deployed image tags from `/opt/eactracker/releases/current.env`.
5. Approve UAT deployment.
6. Pull exact image tags on UAT VM.
7. Run `docker compose run --rm backend npm run db:deploy`.
8. Recreate containers.
9. Run `deploy/scripts/health-check.sh`.
10. Run `deploy/scripts/smoke-test.sh`.
11. Mark release successful.
12. Repeat for Production with explicit approval.

## Commands On VM

```sh
cd /opt/eactracker
./deploy/scripts/deploy-compose.sh uat <frontend-tag> <backend-tag>
```

## Local Build And Push Without Docker Desktop

Run these commands on your workstation after `az login`. Do not use
`az login --identity` locally; managed identity login only works from the Azure
VM because it depends on the Azure Instance Metadata endpoint.

```powershell
$acr = "acrpfms"
$tag = git rev-parse --short=12 HEAD

az login
az acr build --registry $acr --image "eactracker-backend:$tag" --file backend/Dockerfile .
az acr build --registry $acr --image "eactracker-frontend:$tag" --file frontend/Dockerfile .
```

## VM Registry Login

Run these commands only after SSHing into the Azure VM. The VM must have a
system-assigned managed identity with `AcrPull` on the container registry.

```sh
az login --identity
az acr login --name acrpfms
```

## SSH Public Key Reset

If SSH reaches the VM but returns `Permission denied (publickey)`, reset the VM
admin user's public key to a key you control:

```powershell
$rg = "ops_projects"
$vm = "vm-pfms-uat"
$keyPath = "$env:USERPROFILE\.ssh\pfms-uat-ed25519"

if (-not (Test-Path "$keyPath.pub")) {
  ssh-keygen -t ed25519 -C "azureuser@pfms-uat" -f $keyPath
}

az vm user update `
  --resource-group $rg `
  --name $vm `
  --username azureuser `
  --ssh-key-value (Get-Content -Raw "$keyPath.pub").Trim()

ssh -i $keyPath azureuser@<vm-public-ip>
```

## Failure Handling

- If migration fails: stop deployment; do not recreate containers.
- If health check fails: rollback to previous tags.
- If smoke test fails: keep logs, rollback unless failure is known non-production dependency.

## Validation

```sh
curl -fsS https://<domain>/api/ready
curl -fsS https://<domain>/api/health
docker compose ps
docker compose logs --tail=200 backend
```

## Emergency Deployment

Use only for a production-breaking defect with maintainer approval:

1. Build hotfix image from a reviewed branch.
2. Record current production tags.
3. Deploy exact hotfix tag with `deploy-compose.sh prod`.
4. Run health and smoke tests.
5. Create follow-up PR documenting the hotfix.

## Database Migration Runbook

1. Review SQL migration for destructive statements.
2. Confirm migration is backward compatible.
3. Run on UAT with a production-like copy if available.
4. During deployment, run `npm run db:deploy` before container replacement.
5. If migration fails, stop deployment and leave previous containers running.

## VM Recreation

1. Re-run Bicep for the environment.
2. Assign VM managed identity permissions: `AcrPull`, `Key Vault Secrets User`, and storage data role if used.
3. Install Docker and Compose plugin.
4. Pull repository deployment folder to `/opt/eactracker`.
5. Retrieve env file from Key Vault.
6. Run `deploy-compose.sh <env> <frontend-tag> <backend-tag>`.

## Certificate Renewal

If using Caddy/Let's Encrypt, renewal is automatic. Validate monthly:

```sh
curl -vI https://app.example.com 2>&1 | grep -i "expire"
```

If using Front Door, monitor certificate expiry through Azure Monitor.

## Entra Secret Rotation

1. Create a new client secret or certificate in Entra.
2. Store it as a new Key Vault secret version.
3. Restart oauth2-proxy container.
4. Validate login.
5. Remove old credential after successful validation.

## User Role Assignment

1. Azure Portal > Microsoft Entra ID > Enterprise applications.
2. Select `EACTracker <env>`.
3. Users and groups > Add user/group.
4. Assign app role.
5. User signs out/in to receive updated role claim.

## Login Troubleshooting

- Redirect error: check registered redirect URI.
- User has no role: check Enterprise Application assignment.
- Backend 401: check `AUTH_PROXY_SECRET`.
- Backend 403: check role is included in backend authorization rules.

## Incident Response

1. Confirm impact and current release tag.
2. Check Azure Monitor availability alert.
3. Inspect `docker compose ps` and backend logs.
4. Check PostgreSQL availability and connection count.
5. Roll back if new release is suspected.
6. Record timeline, root cause, and corrective action.

## Common Operational Issues

- High CPU: check long-running imports, scale VM to `D2s_v5`, inspect logs.
- High memory: check SAP upload size and Node heap; restart backend if needed.
- DB connection exhaustion: reduce app pool, inspect stuck transactions, scale PostgreSQL.
- Disk full: prune Docker images with `cleanup-images.sh`, inspect log retention.
- Blob access failure: verify managed identity role assignment and storage firewall.
- Key Vault access failure: verify VM identity and `Key Vault Secrets User` role.
- Application unavailable: run health check, inspect reverse proxy, oauth2-proxy, backend.
- Account compromise: disable user in Entra, revoke sessions, review logs, rotate affected secrets.
- Maintainer handover: provide Azure subscription access, Azure DevOps access, Key Vault break-glass process, and this documentation set.
