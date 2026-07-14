# 03 Azure Resource Inventory

Preferred separation is one resource group per environment:

```text
rg-eactracker-shared
rg-eactracker-uat
rg-eactracker-prod
```

If your Azure administrator only gives you one existing resource group, deploy only the target environment into that resource group with `az deployment group ...`. Do not use subscription-scope deployment and do not attempt to create resource groups from Bicep.

Recommended region: `southeastasia` unless your organisation standardises elsewhere.

## Shared Resources

| Name | Type | SKU | Mandatory | Purpose |
| --- | --- | --- | --- | --- |
| `acreactracker` | Azure Container Registry | Basic initially, Standard if image retention/scanning policy requires | Yes | Stores immutable frontend/backend/proxy images |
| `kv-eactracker-shared` | Key Vault | Standard | Yes | Shared non-prod/prod deployment secrets if organisation allows; otherwise split vaults per env |
| `law-eactracker` | Log Analytics Workspace | Pay-as-you-go | Yes | Central logs and metrics |
| `appi-eactracker` | Application Insights | Workspace-based | Yes | App telemetry |

## UAT Resources

| Name | Type | Starting SKU | Mandatory | Network access | Identity permissions |
| --- | --- | --- | --- | --- | --- |
| `<provided-uat-resource-group>` | Existing resource group | n/a | Yes | n/a | Azure DevOps service connection Contributor on this RG |
| `vnet-pfms-uat` | Virtual network | n/a | Yes | VM, DB, Key Vault, Storage private traffic | n/a |
| `nsg-pfms-uat` | NSG | n/a | Yes | Inbound 80/443 only; SSH JIT/fixed IP only | n/a |
| `vm-pfms-uat` | Linux VM | `Standard_D2s_v5` | Yes | Public 443, optional 80 redirect | Managed identity: AcrPull, Key Vault Secrets User |
| `pg-pfms-uat` | Azure Database for PostgreSQL Flexible Server | Burstable `Standard_B1ms` | Yes | VM subnet/private endpoint only | DB admin managed by Key Vault |
| `stpfmsuat` | Storage account | Standard LRS | Yes for future durable files | Private endpoint preferred | VM identity: Storage Blob Data Contributor |
| `kv-pfms-uat` | Key Vault | Standard | Yes | VM and pipeline | VM identity secret read |

## Production Resources

| Name | Type | Starting SKU | Mandatory | Network access | Identity permissions |
| --- | --- | --- | --- | --- | --- |
| `<provided-prod-resource-group>` | Existing resource group | n/a | Yes | n/a | Azure DevOps service connection Contributor on this RG with approval |
| `vnet-eactracker-prod` | Virtual network | n/a | Yes | Production VM and private dependencies | n/a |
| `nsg-eactracker-prod` | NSG | n/a | Yes | Inbound 443; 80 only redirect; SSH JIT/fixed IP only | n/a |
| `vm-eactracker-prod` | Linux VM | `Standard_B2ms` initially | Yes | Public reverse proxy only | AcrPull, Key Vault Secrets User, Storage Blob Data Contributor |
| `pg-eactracker-prod` | PostgreSQL Flexible Server | General Purpose `D2ds_v5`, scale later | Yes | VM/private endpoint only | Least privilege DB user |
| `steactrackerprod` | Storage account | Standard LRS/ZRS if required | Yes for future durable files | Private endpoint preferred | VM identity scoped to containers |
| `kv-eactracker-prod` | Key Vault | Standard with purge protection | Yes | VM and pipeline | VM identity secret read |
| `afd-eactracker-prod` | Front Door Standard + WAF | Standard | Optional | Internet edge | Only if public-facing and cost justified |

## VM Sizing

- UAT: `Standard_D2s_v5` to avoid current `Standard_B2s` capacity restrictions in `southeastasia`.
- Production: `Standard_B2ms` to start.
- Future production scale-up: `Standard_D2s_v5` or `D4s_v5` before considering extra VMs.

## Cost Categories

Confirm all pricing in Azure Pricing Calculator. Expected categories: VM compute, managed disks, PostgreSQL compute/storage/backups, Container Registry storage, Key Vault transactions, Storage account capacity/transactions, Log Analytics ingestion/retention, Application Insights ingestion, public IP/bandwidth, optional Front Door/WAF.
