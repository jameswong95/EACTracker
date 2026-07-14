using '../main.bicep'

param environment = 'uat'
param appName = 'pfms'
param location = 'southeastasia'
param adminUsername = 'azureuser'
param sshPublicKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDqcB5n2dN4XPfJLGu0HcQMfSkHho140lfwqd99CjblPr2kmQ+Fo4gL71KZXUluICDgU3BR1H00hHLkVp3bl8hT+aP0PDxvUQr6VwAFdD+qOwdYm2oIV7HP7skN5kbGXHfChFxAJNUHg4CWnjNZ8GrQhsr19HrtVstIjbVAQvvbFDzesBUrNawjBD+esQ/9p++bxS/GlAT3+YGkQGYC5L1l++N/jQmKQ2p1kMN/Op/0VOhfer/V8Mg0Xtc1oF9owRXxut8+WnmdFR9BdjIMDuCYCzupLVZHLjVxphtEXtCRbvAnxF7TY28a0wzL999fAHL1Ctf6fEVFZZONQoduO9AZ/j7F9mJ0p8oeOspapW/H7a8HVs+b7q2vqSGjiT/JukW/OFkeXUgZSn92oiBRVuVuzjRmNOVVoe1bNQ1HLIsyQIbfwdNTuLONoM9laRgPcrv8BFpJuwUFsb1eaoIwohtwPkDmbuwtu3egqoms+GmLELE2Nd2/EEVvQuzjJOHkFaU= generated-by-azure'
param vmSize = 'Standard_D2s_v5'
param postgresSkuName = 'Standard_B1ms'
param postgresAdminPassword = readEnvironmentVariable('POSTGRES_ADMIN_PASSWORD')
