You have full access to my application codebase.

I need you to inspect the entire repository and produce a complete, implementation-ready, start-to-finish deployment guide for deploying this web application to Microsoft Azure.

Do not give me a generic Azure tutorial. Base the deployment guide on the actual technologies, frameworks, folder structure, configuration files, authentication approach, database, frontend, backend, build process and runtime requirements found in this repository.

## Project context

The application is expected to support approximately:

* 200 registered business users
* Approximately 20–50 concurrent users initially
* One primary developer and maintainer
* Separate UAT and Production environments

The priority is simplicity, maintainability, security, repeatable deployment and straightforward rollback.

Avoid unnecessary enterprise complexity.

Do not recommend:

* AKS or Kubernetes
* A large microservices architecture
* Manually copying application files onto the server
* Hosting the production database inside the VM
* Storing uploaded files permanently on the VM
* Hardcoded secrets
* Permanent public SSH or RDP access
* Deploying Docker images using the `latest` tag
* Blue-green deployment
* A multi-VM high-availability setup unless the current application has a strong technical requirement for it

## Target Azure architecture

Use the following target architecture unless the existing codebase has a strong technical reason requiring a variation:

* Azure DevOps Repos
* Azure DevOps YAML Pipelines
* Azure Container Registry
* One Linux Azure VM for UAT
* One Linux Azure VM for Production
* Docker
* Docker Compose
* Nginx or Caddy as the reverse proxy
* Frontend container
* Backend/API container
* Optional background worker container only if the codebase requires one
* Azure SQL Database or Azure Database for PostgreSQL, based on the application’s existing database technology
* Azure Blob Storage for uploaded files, generated reports and attachments
* Azure Key Vault for secrets
* Azure Managed Identity for accessing Key Vault and supported Azure services
* Microsoft Entra ID SSO
* Application Insights
* Log Analytics Workspace
* Azure Monitor alerts
* Infrastructure as Code using Bicep
* Separate Azure resource groups for UAT and Production
* Versioned Docker-image deployments
* Simple rollback using the previously deployed Docker image tag
* Azure Front Door Standard with WAF only if the application is internet-facing and the added cost is justified

The VM should be treated as replaceable. Business data, uploaded files, secrets and deployable images must live outside the VM.

## Your responsibilities

Complete the following work in order.

# 1. Analyse the existing codebase

Inspect the complete repository and identify:

* Frontend framework and version
* Backend framework and version
* Programming languages
* Package managers
* Database engine
* ORM or database-access technology
* Existing authentication implementation
* Existing authorisation or RBAC implementation
* Current environment-variable structure
* Existing Dockerfiles
* Existing Docker Compose files
* Existing CI/CD files
* Existing reverse-proxy configuration
* File-upload implementation
* Background jobs or scheduled jobs
* Cache usage
* Queue usage
* Email or notification services
* External integrations
* Current logging implementation
* Current health-check endpoints
* Current database migration mechanism
* Build commands
* Test commands
* Runtime commands
* Required ports
* Persistent-storage requirements

Start your response with a concise assessment of the application as it currently exists.

Clearly identify:

* What is already production-ready
* What is missing
* What must be changed before deployment
* Security risks
* Deployment blockers
* Code changes required
* Configuration changes required
* Assumptions you had to make

Do not silently assume that the application is container-ready or compatible with Microsoft Entra ID.

# 2. Confirm the final deployment architecture

Create an architecture diagram using Mermaid.

The diagram must show:

* Users
* DNS
* Azure Front Door and WAF, when applicable
* Public HTTPS endpoint
* Azure virtual network
* Network Security Group
* UAT VM
* Production VM
* Nginx or Caddy
* Frontend container
* Backend container
* Optional worker container
* Azure Container Registry
* Managed database
* Blob Storage
* Key Vault
* Microsoft Entra ID
* Application Insights
* Log Analytics
* Azure Monitor
* Azure DevOps pipeline

Explain each component and why it is required.

Keep the design manageable for one maintainer.

Do not include:

* Kubernetes
* Multiple production application VMs
* Blue-green deployment infrastructure
* Recovery Services Vault
* Dedicated disaster-recovery infrastructure

# 3. Produce an exact Azure resource inventory

Provide an environment-by-environment list of Azure resources.

Use a structure similar to:

```text
rg-<application>-shared
rg-<application>-uat
rg-<application>-prod
```

For each Azure resource, specify:

* Resource name
* Resource type
* Environment
* Recommended Azure region
* Recommended starting SKU
* Purpose
* Required network access
* Required identity permissions
* Dependencies
* Whether it is mandatory or optional

Recommend appropriate starting VM sizes for:

* UAT
* Production
* A future production scale-up scenario

Prefer a Linux VM unless the codebase clearly requires Windows.

Provide estimated cost categories but do not invent exact prices. Mark all pricing as requiring confirmation in the Azure Pricing Calculator.

# 4. Define the repository changes

Based on the actual repository, show the exact files that need to be created or changed.

Include a proposed final repository structure such as:

```text
/
├── src/
├── infra/
│   ├── main.bicep
│   ├── modules/
│   │   ├── network.bicep
│   │   ├── vm.bicep
│   │   ├── database.bicep
│   │   ├── storage.bicep
│   │   ├── key-vault.bicep
│   │   ├── monitoring.bicep
│   │   └── container-registry.bicep
│   └── parameters/
│       ├── uat.bicepparam
│       └── prod.bicepparam
├── deploy/
│   ├── docker-compose.uat.yml
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   ├── scripts/
│   └── systemd/
├── pipelines/
│   ├── pull-request.yml
│   ├── build.yml
│   ├── deploy-uat.yml
│   └── deploy-prod.yml
└── docs/
    ├── deployment-runbook.md
    ├── rollback-runbook.md
    └── entra-sso-setup.md
```

Adapt this structure to the repository rather than forcing it blindly.

For every proposed file:

* State why it is needed
* Provide the complete file content where practical
* Clearly mark placeholders
* Explain which values must never be committed
* Use environment-specific configuration

# 5. Containerise the application

Create or correct the Docker configuration based on the actual codebase.

Provide:

* Production-ready frontend Dockerfile
* Production-ready backend Dockerfile
* Worker Dockerfile if required
* `.dockerignore`
* UAT Docker Compose file
* Production Docker Compose file
* Container health checks
* Restart policies
* Resource limits where appropriate
* Internal Docker network configuration
* Persistent-volume strategy
* Reverse-proxy configuration

Requirements:

* Use multi-stage builds
* Run containers as non-root where supported
* Do not embed secrets into images
* Do not store uploaded files in the container
* Do not store the database in a container
* Do not expose backend ports directly to the internet
* Only the reverse proxy should publish the application port
* Use immutable image tags
* Include application version and Git commit metadata
* Ensure logs are written to stdout/stderr or a deliberate external location

Show the exact local commands to build and test the containers.

# 6. Implement Microsoft Entra ID SSO

Inspect the current authentication implementation and design the correct Microsoft Entra ID integration for the actual frontend and backend stack.

Use OpenID Connect and OAuth 2.0.

Where the frontend is a browser-based single-page application:

* Use Authorization Code Flow with PKCE
* Do not place a client secret in the frontend
* Use an official Microsoft authentication library appropriate to the framework
* Store only non-secret configuration in the frontend
* Handle token acquisition securely
* Handle token expiry and renewal
* Handle logout correctly

For the backend:

* Configure it as a protected API when applicable
* Validate issuer
* Validate audience
* Validate signature
* Validate expiry
* Validate tenant
* Validate scopes or application roles
* Reject missing or invalid tokens
* Perform server-side authorisation for every protected operation
* Do not rely on frontend button visibility as authorisation

Provide a complete Microsoft Entra ID setup guide covering the following.

## App registrations

Determine whether the system should use:

* One app registration for the frontend and one for the backend API, or
* One combined web-application registration

Choose based on the actual codebase and explain the decision.

For each registration, document:

* Display name
* Supported account type
* Redirect URIs for local development
* Redirect URIs for UAT
* Redirect URIs for Production
* Front-channel logout URL
* Exposed API scopes
* Authorised client applications
* Required API permissions
* Admin consent requirements
* Token configuration
* Optional claims
* Group claims, if needed
* App roles

## Role-based access control

Create a recommended Microsoft Entra application-role model based on the application’s existing business functions.

Potential examples include:

* Administrator
* Project Manager
* Approver
* Finance User
* Auditor
* Viewer

Do not assume these roles are correct. Derive the final roles from the codebase and current application features.

Explain:

* How app roles are created in Microsoft Entra ID
* How users or groups are assigned
* How roles appear in tokens
* How the backend validates roles
* How the frontend uses roles for user-experience purposes only
* How unauthorised API requests are rejected
* How role changes take effect
* How to troubleshoot missing role claims

## Environment separation

Recommend whether to use:

* Separate Microsoft Entra app registrations for UAT and Production, or
* Shared registrations with different redirect URIs

Optimise for security, operational clarity and one-person maintenance.

## Secrets and credentials

Where a backend client secret or certificate is required:

* Prefer certificates or Managed Identity where supported
* Store secrets in Key Vault
* Never store credentials in the repository
* Explain credential rotation
* Explain expiry monitoring
* Explain how the VM retrieves the credential

## Code implementation

Identify the exact files to change.

Provide production-quality code for:

* Frontend login
* Frontend logout
* Authentication callback handling
* Protected routes
* Access-token acquisition
* API request interceptor
* Backend token validation
* Backend authorisation middleware
* Role-based endpoint protection
* User-profile mapping
* Local-development configuration
* UAT configuration
* Production configuration

Use the official library appropriate to the detected stack.

Examples may include:

* MSAL Browser
* MSAL React
* Microsoft.Identity.Web
* A supported Node.js OpenID Connect integration
* Spring Security OAuth2 Resource Server
* Python MSAL or a compatible OpenID Connect integration

Do not choose a library until you inspect the repository.

# 7. Configure Azure Managed Identity and Key Vault

Provide exact steps to:

* Enable a system-assigned Managed Identity on each VM
* Create the Key Vault
* Enable soft delete
* Enable purge protection where appropriate
* Store database credentials when credentials are required
* Store external API credentials
* Store Microsoft Entra backend credentials when required
* Store storage credentials only when Managed Identity cannot be used
* Grant the VM identity the minimum required permissions
* Retrieve secrets from the application
* Cache secrets safely
* Rotate secrets
* Remove hardcoded configuration

Prefer Managed Identity and role-based access over connection strings and access keys wherever the application and Azure service support them.

Provide the exact Azure CLI commands and Bicep configuration.

# 8. Configure the managed database

Based on the database technology found in the repository:

* Select Azure SQL Database or Azure Database for PostgreSQL
* Recommend the starting compute tier
* Configure firewall or private networking
* Configure TLS
* Configure connection pooling
* Configure maintenance settings
* Configure monitoring
* Configure database users
* Configure least-privilege permissions
* Configure separate UAT and Production databases
* Configure migration execution

Explain exactly how database migrations should run during deployment.

Migrations must be safe for application rollback.

Use backward-compatible migration practices such as:

1. Add new structures
2. Deploy compatible application code
3. Migrate existing data
4. Remove old structures in a later deployment

Do not perform destructive schema changes automatically without a deliberate approval step.

# 9. Configure Azure Blob Storage

Inspect how the codebase currently handles files.

Provide exact changes required to move uploaded files and generated files to Blob Storage.

Include:

* Container naming
* Private-access configuration
* Managed Identity access
* Upload implementation
* Download implementation
* Short-lived SAS usage only when required
* Metadata storage in the database
* File-size validation
* Content-type validation
* Malware-scanning recommendation
* Retention strategy
* Soft-delete configuration if appropriate
* CORS configuration when required
* UAT and Production separation

Do not make Blob containers publicly readable unless there is a justified requirement.

# 10. Configure networking and TLS

Provide the full networking plan:

* Virtual network
* Subnets
* NSGs
* Public IP requirements
* Private endpoints where justified
* VM inbound rules
* VM outbound rules
* Database access
* Key Vault access
* Storage access
* Azure Container Registry access
* Administrative access
* DNS
* HTTPS certificates

Only expose:

* Port 443 publicly
* Port 80 only for HTTP-to-HTTPS redirection, if used

Do not permanently expose:

* Port 22
* Port 3389
* Database ports
* Backend application ports

Recommend one administration method:

* Azure Bastion
* Just-in-Time VM access
* Corporate VPN
* SSH restricted to an approved fixed IP

Explain the trade-off and choose the simplest secure option for this application.

Configure HTTPS using either:

* An Azure Front Door-managed certificate, or
* Let’s Encrypt with automated renewal at the reverse proxy

Provide exact certificate-renewal and expiry-monitoring steps.

# 11. Create the Azure DevOps CI/CD pipelines

Inspect the repository and generate complete Azure DevOps YAML pipelines.

The pipelines must include the following.

## Pull-request validation

* Dependency installation
* Compilation
* Linting
* Unit tests
* Security checks
* Secret scanning
* Dependency vulnerability scanning
* Docker build validation
* Optional migration validation

## Build pipeline

* Generate a release version
* Build frontend and backend images
* Tag images using the build number
* Tag images using the Git commit SHA
* Push images to Azure Container Registry
* Publish deployment metadata
* Never rely only on `latest`

## UAT deployment

* Deploy automatically or with lightweight approval
* Pull the exact image tags
* Retrieve configuration securely
* Run approved database migrations
* Update the Docker Compose image versions
* Recreate the affected containers
* Run container health checks
* Run smoke tests
* Preserve deployment history
* Stop and report the deployment when health checks fail
* Support manual rollback to the previously deployed image tag

## Production deployment

* Require explicit approval
* Show the exact release version
* Show database-migration impact
* Show the previously deployed version
* Pull the approved image tags
* Update the Docker Compose image versions
* Recreate the affected containers
* Run health checks
* Run smoke tests
* Record who approved and deployed
* Support manual rollback to the previous image version

A short application interruption during container replacement is acceptable.

Do not implement:

* Blue-green deployment
* Canary deployment
* Multiple simultaneous application versions
* Traffic switching between container versions

Use Azure DevOps Environments for UAT and Production.

Explain:

* Service connections
* Workload identity federation where supported
* Variable groups
* Key Vault-linked variables
* Secure files
* Approvals and checks
* Pipeline permissions
* Deployment history
* Rollback procedures

Avoid long-lived Azure client secrets where workload identity federation can be used.

# 12. Implement straightforward Docker Compose deployment

Design a simple deployment strategy suitable for one maintainer.

The deployment process should be:

1. Build immutable Docker images
2. Push the images to Azure Container Registry
3. Record the current deployed image tags
4. Pull the new image tags on the target VM
5. Run approved database migrations
6. Update environment-specific Docker Compose configuration
7. Recreate the required containers
8. Wait for container health checks
9. Run application smoke tests
10. Mark the deployment as successful
11. Retain the previous image tags for rollback

Provide:

* Docker Compose deployment script
* Container health-check script
* Smoke-test script
* Rollback script
* Old-image cleanup script
* Failure handling
* Deployment logging
* Database compatibility considerations

The deployment must not be marked successful when the application health checks fail.

Rollback should use the previously recorded immutable image tags.

The rollback process should:

1. Identify the previous successful release
2. Restore the previous image tags
3. Recreate the affected containers
4. Run health checks
5. Run smoke tests
6. Record the rollback result

Do not implement traffic switching or simultaneous Blue and Green container groups.

# 13. Configure monitoring and alerting

Integrate:

* Application Insights
* Log Analytics
* Azure Monitor
* VM metrics
* Database metrics
* Availability testing

Add or correct structured application logging.

Logs should include, where appropriate:

* Timestamp
* Environment
* Application version
* Git commit
* Request ID
* Correlation ID
* User ID or pseudonymous identifier
* Endpoint
* Response status
* Response time
* Error category

Do not log:

* Passwords
* Access tokens
* Refresh tokens
* Session cookies
* Client secrets
* Full financial records
* Sensitive personal data

Create alerts for:

* Application unavailable
* Repeated health-check failure
* HTTP 5xx spike
* High response time
* VM CPU above threshold
* VM memory above threshold
* Disk usage above threshold
* Database CPU above threshold
* Database connection exhaustion
* Failed deployment
* Failed background job
* Certificate approaching expiry
* Repeated authentication failures
* Microsoft Entra token-validation errors
* Key Vault access failures

Provide recommended starting alert thresholds and explain that they should be adjusted based on actual production behaviour.

# 14. Create Infrastructure as Code

Generate Bicep files for the required Azure infrastructure.

The Bicep implementation should be modular and support UAT and Production parameter files.

Include:

* Resource groups where practical
* Virtual network
* Subnets
* NSGs
* Public IP
* VM
* Managed Identity
* Managed disks
* Container Registry
* Database
* Storage account
* Blob containers
* Key Vault
* Application Insights
* Log Analytics
* Monitor alerts
* Optional Front Door and WAF

Do not include:

* Recovery Services Vault
* VM Backup configuration
* Dedicated disaster-recovery resources
* Blue-green deployment infrastructure

Do not place secrets inside Bicep parameter files.

Provide:

* Validation commands
* What-if commands
* Deployment commands
* Update commands
* Destruction warnings
* Naming conventions
* Tagging conventions
* Environment-specific parameters

# 15. Provide an exact setup order

Create a numbered deployment procedure from an empty Azure subscription to a working Production system.

The procedure must include:

1. Azure subscription preparation
2. Azure CLI installation and login
3. Azure DevOps project creation
4. Repository preparation
5. Azure service-connection creation
6. Azure Container Registry creation
7. Networking creation
8. Database creation
9. Storage creation
10. Key Vault creation
11. VM creation
12. Managed Identity configuration
13. DNS configuration
14. TLS configuration
15. Microsoft Entra ID app registrations
16. Microsoft Entra ID scopes and roles
17. Application code updates
18. Container builds
19. Pipeline setup
20. UAT deployment
21. UAT Microsoft Entra login verification
22. Database migration verification
23. Blob upload verification
24. Monitoring verification
25. Production deployment approval
26. Production deployment
27. Smoke testing
28. Rollback testing
29. Operational handover

For every step include:

* Where to perform it
* Exact Azure Portal path where relevant
* Exact Azure CLI command where practical
* Required inputs
* Expected output
* Validation check
* Common failure scenarios
* Troubleshooting steps

# 16. Create environment-configuration examples

Provide complete examples for:

* `.env.example`
* Local-development configuration
* UAT configuration
* Production configuration
* Frontend Microsoft Entra configuration
* Backend Microsoft Entra configuration
* Database configuration
* Blob Storage configuration
* Application Insights configuration

Clearly classify each setting as:

* Public configuration
* Sensitive secret
* Environment-specific value
* Generated value
* Key Vault value

Never include real credentials.

# 17. Create deployment and validation checklists

Produce checklists for the following.

## Pre-deployment

* Tests passing
* Security scans passing
* Docker images built
* Docker images tagged
* Migration reviewed
* Secrets available
* Microsoft Entra redirect URIs confirmed
* Current production version recorded
* Previous rollback image confirmed
* Health-check endpoint available

## Post-deployment

* Health endpoint
* Microsoft Entra login
* Microsoft Entra logout
* Role-based access
* API token validation
* Database read/write
* File upload
* File download
* Background jobs
* Email or notification integration
* Logs
* Metrics
* Alerts
* SSL certificate
* Application responsiveness
* Rollback version recorded

## Microsoft Entra SSO validation

Test:

* Valid authorised user
* Valid unauthorised user
* User with no assigned role
* Expired token
* Wrong audience
* Wrong tenant
* Missing token
* Invalid signature
* Revoked access
* Role change
* Logout
* Session expiry
* Multiple browser tabs
* Direct API access without using the frontend

# 18. Create the operational runbooks

Generate complete Markdown runbooks for:

* Normal deployment
* Emergency deployment
* Application rollback
* Database migration
* VM recreation from Bicep
* Certificate renewal
* Microsoft Entra secret or certificate rotation
* User-role assignment
* Microsoft Entra login troubleshooting
* Production incident response
* Failed deployment
* High CPU
* High memory
* Database connection exhaustion
* Disk-full condition
* Blob Storage access failure
* Key Vault access failure
* Application unavailable
* Account compromise
* Maintainer handover

The runbooks must be understandable by another engineer who has never seen the application.

Do not create:

* Backup runbooks
* Database restoration runbooks
* Disaster-recovery runbooks
* Blue-green deployment runbooks
* Load-testing runbooks

# 19. Security review

Perform a deployment-focused security review of the current codebase.

Check for:

* Hardcoded secrets
* Insecure environment variables
* Missing server-side validation
* Missing authorisation
* Broken access control
* Unsafe file uploads
* SQL injection risk
* Command injection risk
* Path traversal
* Missing CSRF protections where applicable
* XSS risk
* Insecure CORS
* Weak cookie settings
* Missing security headers
* Token leakage
* Excessive logging
* Debug mode in Production
* Public database access
* Public storage access
* Insecure redirect URIs
* Overprivileged Managed Identities
* Overprivileged Azure DevOps service connections

Give each issue:

* Severity
* File and line reference
* Risk
* Recommended fix
* Whether it blocks Production deployment

# 20. Required final deliverables

Your final response must contain:

1. Current-state codebase assessment
2. Production-readiness gap analysis
3. Final Azure architecture
4. Mermaid architecture diagram
5. Complete Azure resource inventory
6. Recommended SKUs
7. Repository-change plan
8. Exact files to add or modify
9. Docker configuration
10. Docker Compose configuration
11. Reverse-proxy configuration
12. Microsoft Entra ID architecture
13. Microsoft Entra app-registration guide
14. Microsoft Entra role and scope design
15. Complete Microsoft Entra code integration
16. Bicep infrastructure files
17. Azure DevOps YAML pipelines
18. Docker Compose deployment scripts
19. Simple image-tag rollback script
20. Database setup and migration process
21. Blob Storage integration
22. Key Vault and Managed Identity setup
23. Monitoring and alert configuration
24. Start-to-finish setup guide
25. Testing and validation checklists
26. Application rollback guide
27. Operational runbooks
28. Security findings
29. Final go-live checklist

Do not include:

* Load-testing plans
* Backup configuration
* Disaster-recovery plans
* Blue-green deployment
* Canary deployment
* Multi-VM high-availability implementation

# 21. Output format

Organise the work into the following sections:

```text
01-current-state-assessment.md
02-target-architecture.md
03-azure-resource-inventory.md
04-codebase-changes.md
05-containerisation.md
06-entra-sso.md
07-infrastructure-as-code.md
08-azure-devops-pipelines.md
09-database-and-storage.md
10-networking-and-security.md
11-monitoring.md
12-deployment-runbook.md
13-rollback-runbook.md
14-validation-checklists.md
15-security-review.md
16-go-live-checklist.md
```

Where you can safely make repository changes, create these files directly under:

```text
docs/deployment/
```

Also create or update the actual implementation files required for:

* Docker
* Docker Compose
* Nginx or Caddy
* Microsoft Entra authentication
* Bicep
* Azure DevOps pipelines
* Deployment scripts
* Rollback scripts
* Health checks
* Smoke tests
* Environment examples

Before modifying application code:

* Inspect the relevant existing files
* Preserve existing working behaviour
* Reuse existing project conventions
* Avoid unnecessary refactoring
* Explain every material change
* Do not delete working authentication until the replacement is complete
* Do not commit credentials
* Do not execute destructive Azure or database operations

# 22. Working method

Proceed in this order:

1. Inspect the repository.
2. Summarise the detected stack and deployment gaps.
3. State any assumptions.
4. Propose the final architecture.
5. Produce a file-by-file implementation plan.
6. Implement safe repository changes.
7. Generate the complete deployment documentation.
8. Validate configuration consistency.
9. Identify anything that still requires manual Azure Portal action.
10. Provide a final go-live checklist.

Do not stop after giving high-level recommendations.

Do not tell me merely to “configure Azure,” “set up SSO” or “create a pipeline.”

Provide exact, actionable steps, commands, configuration, code, filenames, validation checks and rollback procedures based on this repository.
