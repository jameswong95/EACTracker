targetScope = 'resourceGroup'

@allowed(['uat', 'prod'])
param environment string
param appName string = 'pfms'
param location string = 'southeastasia'
param adminUsername string

@description('OpenSSH public key for the VM admin user, for example: ssh-ed25519 AAAAC3...')
@minLength(40)
param sshPublicKey string

param vmSize string
param postgresSkuName string
@secure()
param postgresAdminPassword string

var suffix = '${appName}-${environment}'

module network 'modules/network.bicep' = {
  name: 'network-${environment}'
  params: {
    location: location
    namePrefix: suffix
  }
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-${environment}'
  params: {
    location: location
    namePrefix: suffix
  }
}

module acr 'modules/container-registry.bicep' = if (environment == 'uat') {
  name: 'acr-shared'
  params: {
    location: location
    registryName: 'acr${replace(appName, '-', '')}'
  }
}

module kv 'modules/key-vault.bicep' = {
  name: 'kv-${environment}'
  params: {
    location: location
    vaultName: 'kv-${suffix}'
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage-${environment}'
  params: {
    location: location
    storageName: toLower('st${replace(suffix, '-', '')}')
  }
}

module database 'modules/database.bicep' = {
  name: 'postgres-${environment}'
  params: {
    location: location
    serverName: 'pg-${suffix}'
    skuName: postgresSkuName
    administratorLoginPassword: postgresAdminPassword
  }
}

module vm 'modules/vm.bicep' = {
  name: 'vm-${environment}'
  params: {
    location: location
    namePrefix: suffix
    subnetId: network.outputs.appSubnetId
    adminUsername: adminUsername
    sshPublicKey: sshPublicKey
    vmSize: vmSize
  }
}
