# PFMS UAT Deployment Steps

This runbook describes what to do on your local machine and what to do on the UAT VM.

The deployment flow is:

1. Commit and push the latest code from local.
2. Build backend and frontend Docker images in Azure Container Registry.
3. Copy the generated image tag.
4. SSH into the VM.
5. Pull the latest code and deploy the matching image tag.
6. Verify containers, migrations, and health checks.

## Local Machine

Run these commands from your local project folder.

```powershell
cd C:\Users\james\EACTracker
```

### 1. Check Git Status

```bash
git status
```

Review any changed files before continuing.

### 2. Pull Latest Main

```bash
git pull origin main
```

### 3. Confirm Status Again

```bash
git status
```

### 4. Commit and Push Changes

```bash
git add .
git commit -m "Update PFMS deployment"
git push origin main
```

If Git says there is nothing to commit, continue to the next step.

### 5. Login to Azure

```bash
az login
```

### 6. Select Azure Subscription

```bash

az login --tenant e8f7ff8e-b270-401e-aebf-d450221ab144 --allow-no-subscriptions

```

### 7. Create the Deployment Image Tag

PowerShell:

```powershell
$TAG = "pfms-uat-$(git rev-parse --short HEAD)"
```

Bash:

```bash
TAG="pfms-uat-$(git rev-parse --short HEAD)"
```

### 8. Build Backend Image in ACR

PowerShell:

```powershell
az acr build --registry acrpfms --image "eactracker-backend:$TAG" --file backend/Dockerfile .
```

Bash:

```bash
az acr build --registry acrpfms \
  --image "eactracker-backend:${TAG}" \
  --file backend/Dockerfile .
```

### 9. Build Frontend Image in ACR

PowerShell:

```powershell
az acr build --registry acrpfms --image "eactracker-frontend:$TAG" --file frontend/Dockerfile .
```

Bash:

```bash
az acr build --registry acrpfms \
  --image "eactracker-frontend:${TAG}" \
  --file frontend/Dockerfile .
```

### 10. Print and Copy the Tag

PowerShell:

```powershell
echo $TAG
```

Bash:

```bash
echo "$TAG"
```

Example:

```text
pfms-uat-a1b2c3d
```

Copy this tag. You will use it on the VM.

## VM

### 1. SSH Into the VM

```bash
ssh username@20.205.208.26
```

If using a private key:

```bash
ssh -i path/to/key.pem username@20.205.208.26
```

If SSH times out, confirm the VM is running and TCP port `22` is allowed in the VM network/security rules.

### 2. Go to the UAT App Directory

```bash
cd /opt/pfms-uat
```

### 3. Check VM Git Status

```bash
git status
```

### 4. Stash VM-Local Deployment File Changes

```bash
git stash push -m "vm local changes before deploy" -- deploy/scripts/deploy-compose.sh deploy/docker-compose.uat.yml deploy/nginx/default.conf
```

This protects known local VM changes that may block `git pull`.

### 5. Pull Latest Main

```bash
git pull origin main
```

### 6. Review or Edit the UAT Environment File

```bash
nano .env
```

Check that the UAT environment variables are correct.

To save and exit nano:

```text
Ctrl + O
Enter
Ctrl + X
```

### 7. Set the Deployment Tag on the VM

Replace `TAG_HERE` with the tag copied from your local machine.

```bash
TAG="TAG_HERE"
```

Example:

```bash
TAG="pfms-uat-a1b2c3d"
```

### 8. Update Image Tags in `.env`

```bash
sed -i '/^BACKEND_IMAGE_TAG=/d;/^FRONTEND_IMAGE_TAG=/d' .env
echo "BACKEND_IMAGE_TAG=${TAG}" >> .env
echo "FRONTEND_IMAGE_TAG=${TAG}" >> .env
```

### 9. Pull the New Backend and Frontend Images

```bash
docker compose --env-file .env -f deploy/docker-compose.uat.yml pull backend frontend
```

### 10. Recreate UAT Services

```bash
docker compose --env-file .env -f deploy/docker-compose.uat.yml up -d --force-recreate backend frontend oauth2-proxy reverse-proxy
```

### 11. Run Database Migrations

```bash
docker compose --env-file .env -f deploy/docker-compose.uat.yml exec backend npm run db:deploy
```

### 12. Check Container Status

```bash
docker compose --env-file .env -f deploy/docker-compose.uat.yml ps
```

Confirm the required services are running.

### 13. Check Health Endpoints

```bash
curl -k -i https://127.0.0.1/api/health
curl -k -i https://127.0.0.1/api/ready
```

Expected result: HTTP `200`.

### 14. Check Backend Logs

```bash
docker compose --env-file .env -f deploy/docker-compose.uat.yml logs --tail=30 backend
```

Look for startup errors, migration errors, database connection failures, or missing configuration.

### 15. Final Git Check

```bash
git status
```

Normally, `git pull origin main` should already have been completed before deployment. Run it again only if you need to confirm the VM is still current:

```bash
git pull origin main
```

## Success Criteria

The UAT deployment is successful when:

- The backend image is built and pulled using the new tag.
- The frontend image is built and pulled using the new tag.
- `docker compose ps` shows the required services running.
- `/api/health` returns HTTP `200`.
- `/api/ready` returns HTTP `200`.
- Backend logs show no startup, migration, database, or configuration errors.

## Important Note

The image tag used locally must be exactly the same tag set on the VM:

```text
BACKEND_IMAGE_TAG=pfms-uat-a1b2c3d
FRONTEND_IMAGE_TAG=pfms-uat-a1b2c3d
```
