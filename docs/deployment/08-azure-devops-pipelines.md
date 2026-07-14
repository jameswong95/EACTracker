# 08 Azure DevOps Pipelines

## Service Connections

Use Azure Resource Manager service connections with workload identity federation. Microsoft recommends workload identity federation for new service connections because it avoids long-lived secrets.

Create:

- `sc-eactracker-uat`
- `sc-eactracker-prod`

Do not grant access to all pipelines; authorize only the needed YAML pipelines.

## Pipelines

- `pipelines/pull-request.yml`: install dependencies, build, audit, Docker build validation.
- `pipelines/build.yml`: build immutable frontend/backend images and push to ACR.
- `pipelines/deploy-uat.yml`: deploy selected image tags to UAT VM.
- `pipelines/deploy-prod.yml`: approval-gated production deployment.

## Variable Groups

Use:

- `vg-eactracker-shared`
- `vg-eactracker-uat`
- `vg-eactracker-prod`

Secrets should be linked from Key Vault where possible.

Required variables:

```text
ACR_NAME
IMAGE_TAG
UAT_HOST
PROD_HOST
APP_DOMAIN
AZURE_REGION
```

