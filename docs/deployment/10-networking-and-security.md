# 10 Networking And Security

## Network Plan

- Public inbound: `443` only.
- Optional inbound `80`: redirect to HTTPS only.
- No permanent public `22`.
- No public database port.
- Backend container port `4000` internal only.
- PostgreSQL, Key Vault, Storage via private endpoints where cost/network policy allows.

## Administration

Recommended simple secure option: Just-in-Time VM access restricted to maintainer IP. Azure Bastion is more secure/centralised but adds cost.

For one-off bootstrap access without Bastion, add a temporary NSG rule restricted
to your current public IP, SSH into the VM, then delete the rule when finished:

```powershell
$rg = "ops_projects"
$nsg = "nsg-pfms-uat"
$myIp = (Invoke-RestMethod "https://api.ipify.org").Trim()

az network nsg rule create `
  --resource-group $rg `
  --nsg-name $nsg `
  --name AllowSshBootstrap `
  --priority 120 `
  --direction Inbound `
  --access Allow `
  --protocol Tcp `
  --source-address-prefixes "$myIp/32" `
  --source-port-ranges "*" `
  --destination-address-prefixes "*" `
  --destination-port-ranges 22

# After bootstrap/deployment:
az network nsg rule delete `
  --resource-group $rg `
  --nsg-name $nsg `
  --name AllowSshBootstrap
```

## TLS

Use Caddy for automated Let's Encrypt certificates if the VM is directly internet-facing. If Azure Front Door is used, use Front Door-managed certificate and keep VM origin restricted where possible.

## CORS

Same-origin production is preferred. If split origins are required, set `CORS_ORIGIN=https://app.example.com`.

## Secrets

Store all sensitive values in Key Vault. The VM retrieves them via Managed Identity during deployment/startup.
