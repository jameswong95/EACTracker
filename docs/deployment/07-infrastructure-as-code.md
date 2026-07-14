# 07 Infrastructure As Code

## Bicep Layout

```text
infra/
├── main.bicep
├── modules/
│   ├── network.bicep
│   ├── vm.bicep
│   ├── database.bicep
│   ├── storage.bicep
│   ├── key-vault.bicep
│   ├── monitoring.bicep
│   └── container-registry.bicep
└── parameters/
    ├── uat.bicepparam
    └── prod.bicepparam
```

## Validation

From PowerShell:

```powershell
az bicep build --file infra/main.bicep

if (-not (Test-Path "$env:USERPROFILE\.ssh\pfms-uat-ed25519.pub")) {
  ssh-keygen -t ed25519 -C "azureuser@pfms-uat" -f "$env:USERPROFILE\.ssh\pfms-uat-ed25519"
}

$env:SSH_PUBLIC_KEY = (Get-Content -Raw "$env:USERPROFILE\.ssh\pfms-uat-ed25519.pub").Trim()
$env:POSTGRES_ADMIN_PASSWORD = "<temporary-strong-password>"

az deployment group what-if `
  --resource-group <provided-uat-resource-group> `
  --template-file infra/main.bicep `
  --parameters infra/parameters/uat.bicepparam
```

## Deployment

From PowerShell:

```powershell
$env:SSH_PUBLIC_KEY = (Get-Content -Raw "$env:USERPROFILE\.ssh\pfms-uat-ed25519.pub").Trim()
$env:POSTGRES_ADMIN_PASSWORD = "<temporary-strong-password>"

az deployment group create `
  --resource-group <provided-uat-resource-group> `
  --template-file infra/main.bicep `
  --parameters infra/parameters/uat.bicepparam

$env:SSH_PUBLIC_KEY = (Get-Content -Raw "$env:USERPROFILE\.ssh\pfms-prod-ed25519.pub").Trim()
$env:POSTGRES_ADMIN_PASSWORD = "<temporary-strong-password>"

az deployment group create `
  --resource-group <provided-prod-resource-group> `
  --template-file infra/main.bicep `
  --parameters infra/parameters/prod.bicepparam
```

## Destruction Warning

Do not delete resources from the provided resource group from automation. PostgreSQL, Key Vault, Storage, Log Analytics, and public IP/DNS resources contain operational state or references.
