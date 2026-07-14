using '../main.bicep'

param environment = 'prod'
param appName = 'eactracker'
param location = 'southeastasia'
param adminUsername = 'azureuser'
param sshPublicKey = readEnvironmentVariable('SSH_PUBLIC_KEY')
param vmSize = 'Standard_B2ms'
param postgresSkuName = 'Standard_D2ds_v5'
param postgresAdminPassword = readEnvironmentVariable('POSTGRES_ADMIN_PASSWORD')
