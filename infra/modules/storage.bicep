param location string
param storageName string

resource st 'Microsoft.Storage/storageAccounts@2024-01-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource uploads 'Microsoft.Storage/storageAccounts/blobServices/containers@2024-01-01' = {
  name: '${st.name}/default/uploads'
  properties: { publicAccess: 'None' }
}

resource reports 'Microsoft.Storage/storageAccounts/blobServices/containers@2024-01-01' = {
  name: '${st.name}/default/reports'
  properties: { publicAccess: 'None' }
}

output storageAccountName string = st.name

