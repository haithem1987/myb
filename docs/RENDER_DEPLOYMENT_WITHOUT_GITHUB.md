# Deploy MYB to Render Without GitHub

This guide shows how to deploy MYB to Render using Docker Hub instead of GitHub repository connection.

## Prerequisites

1. **Docker Hub Account**: Create at https://hub.docker.com
2. **Docker installed** locally
3. **Render account** at https://render.com

## Strategy Overview

```
Local Machine → Build Docker Images → Push to Docker Hub → Deploy on Render
```

## Step 1: Build and Push Docker Images

### A. Login to Docker Hub

```bash
docker login
# Enter your Docker Hub username and password
```

### B. Build and Push All Services

Run this script to build and push all images:

```bash
#!/bin/bash

DOCKER_USERNAME="your-dockerhub-username"  # CHANGE THIS
VERSION="1.0.0"

# Array of services
declare -A SERVICES=(
    ["usermanager"]="./src/services/user-manager/Myb.UserManager/Dockerfile"
    ["timesheet"]="./src/services/time-sheet/Myb.Timesheet/Dockerfile"
    ["docmanager"]="./src/services/document-management/Myb.Document/Dockerfile"
    ["invoice"]="./src/services/invoice-management/Myb.Invoice/Dockerfile"
    ["payment"]="./src/services/payment-service/Myb.Payment/Dockerfile"
    ["notification"]="./src/services/notification-service/Myb.Notification/Dockerfile"
    ["coproperty"]="./src/services/coproperty-management/Myb.Coproperty/Dockerfile"
    ["frontend"]="./src/front/myb.front/Dockerfile"
)

# Build and push each service
for service in "${!SERVICES[@]}"; do
    echo "Building myb-${service}..."
    docker build -f "${SERVICES[$service]}" -t "${DOCKER_USERNAME}/myb-${service}:${VERSION}" .
    docker tag "${DOCKER_USERNAME}/myb-${service}:${VERSION}" "${DOCKER_USERNAME}/myb-${service}:latest"
    
    echo "Pushing myb-${service}..."
    docker push "${DOCKER_USERNAME}/myb-${service}:${VERSION}"
    docker push "${DOCKER_USERNAME}/myb-${service}:latest"
done

echo "All images pushed successfully!"
```

Save as `scripts/docker-push-all.sh` and run:

```bash
chmod +x scripts/docker-push-all.sh
./scripts/docker-push-all.sh
```

## Step 2: Create Databases on Render

Go to Render Dashboard → New → PostgreSQL

Create 5 databases:

### Database 1: Keycloak
- Name: `keycloak-db`
- Database: `keycloak`
- User: `keycloak`
- Plan: Free or Starter

### Database 2: Timesheet
- Name: `timesheet-db`
- Database: `timesheetDB`
- User: `postgres`
- Plan: Free or Starter

### Database 3: Document
- Name: `document-db`
- Database: `documentDB`
- User: `postgres`
- Plan: Free or Starter

### Database 4: Invoice
- Name: `invoice-db`
- Database: `invoiceDB`
- User: `postgres`
- Plan: Free or Starter

### Database 5: Coproperty
- Name: `coproperty-db`
- Database: `copropertyDB`
- User: `postgres`
- Plan: Free or Starter

**Save each database's connection string!**

## Step 3: Create Services on Render

For each service, go to: New → Web Service → "Deploy an existing image from a registry"

### Service 1: Keycloak

```yaml
Image URL: quay.io/keycloak/keycloak:23.0.4
Name: myb-keycloak
Region: Oregon
Plan: Starter

Environment Variables:
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=[your-secure-password]
KC_DB=postgres
KC_DB_URL=[connection-string-from-keycloak-db]
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=[password-from-keycloak-db]
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
KC_HOSTNAME_STRICT_HTTPS=false

Docker Command: start --db=postgres
```

### Service 2: User Manager

```yaml
Image URL: [your-dockerhub-username]/myb-usermanager:latest
Name: myb-usermanager
Region: Oregon
Plan: Starter

Environment Variables:
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__UserDBConnection=[timesheet-db-connection-string]
Keycloak__BaseUrl=[keycloak-url]/realms/MYB/protocol/openid-connect
Keycloak__Authority=[keycloak-url]/realms/MYB
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=[from-keycloak]
```

### Service 3: Timesheet

```yaml
Image URL: [your-dockerhub-username]/myb-timesheet:latest
Name: myb-timesheet
Region: Oregon
Plan: Starter

Environment Variables:
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__TimesheetDBConnection=[timesheet-db-connection-string]
Keycloak__BaseUrl=[keycloak-url]/realms/MYB/protocol/openid-connect
Keycloak__Authority=[keycloak-url]/realms/MYB
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=[from-keycloak]
```

### Service 4: Document Manager

```yaml
Image URL: [your-dockerhub-username]/myb-docmanager:latest
Name: myb-docmanager
Region: Oregon
Plan: Starter

Environment Variables:
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__DocumentDBConnection=[document-db-connection-string]
Keycloak__BaseUrl=[keycloak-url]/realms/MYB/protocol/openid-connect
Keycloak__Authority=[keycloak-url]/realms/MYB
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=[from-keycloak]
```

### Service 5: Invoice

```yaml
Image URL: [your-dockerhub-username]/myb-invoice:latest
Name: myb-invoice
Region: Oregon
Plan: Starter

Environment Variables:
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__InvoiceDBConnection=[invoice-db-connection-string]
Keycloak__BaseUrl=[keycloak-url]/realms/MYB/protocol/openid-connect
Keycloak__Authority=[keycloak-url]/realms/MYB
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=[from-keycloak]
```

### Service 6: Payment

```yaml
Image URL: [your-dockerhub-username]/myb-payment:latest
Name: myb-payment
Region: Oregon
Plan: Starter

Environment Variables:
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
Keycloak__BaseUrl=[keycloak-url]/realms/MYB/protocol/openid-connect
Keycloak__Authority=[keycloak-url]/realms/MYB
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=[from-keycloak]
Stripe__SecretKey=[your-stripe-secret]
Stripe__PublishableKey=[your-stripe-public]
```

### Service 7: Notification

```yaml
Image URL: [your-dockerhub-username]/myb-notification:latest
Name: myb-notification
Region: Oregon
Plan: Starter

Environment Variables:
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
Keycloak__BaseUrl=[keycloak-url]/realms/MYB/protocol/openid-connect
Keycloak__Authority=[keycloak-url]/realms/MYB
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=[from-keycloak]
SendGrid__ApiKey=[your-sendgrid-key]
Email__FromAddress=noreply@myb.com
```

### Service 8: Coproperty

```yaml
Image URL: [your-dockerhub-username]/myb-coproperty:latest
Name: myb-coproperty
Region: Oregon
Plan: Starter

Environment Variables:
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__CopropertyDBConnection=[coproperty-db-connection-string]
Keycloak__BaseUrl=[keycloak-url]/realms/MYB/protocol/openid-connect
Keycloak__Authority=[keycloak-url]/realms/MYB
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=[from-keycloak]
```

### Service 9: Frontend

```yaml
Image URL: [your-dockerhub-username]/myb-frontend:latest
Name: myb-frontend
Region: Oregon
Plan: Starter

Environment Variables:
NODE_ENV=production
KEYCLOAK_URL=[keycloak-url]
KEYCLOAK_REALM=MYB
KEYCLOAK_CLIENT_ID=MYB-client
API_BASE_URL=[frontend-url]
```

## Step 4: Configure Keycloak

After Keycloak is deployed:

1. Access Keycloak admin console: `https://myb-keycloak-xxxx.onrender.com/admin`
2. Login with admin credentials
3. Create MYB realm
4. Create OAuth2 client with ID: `MYB-client`
5. Configure redirect URIs
6. Copy client secret
7. Update all other services with the correct Keycloak URL and client secret

## Step 5: Update Frontend Configuration

Update environment variables in frontend service with actual service URLs.

## Alternative: Automation Script

Create a script to automate service creation using Render API:

```bash
#!/bin/bash

# This would use Render's REST API to create services programmatically
# Requires Render API key
```

## Deployment Order

1. ✅ Create all 5 databases first
2. ✅ Deploy Keycloak (wait for URL)
3. ✅ Configure Keycloak realm and client
4. ✅ Deploy backend services with Keycloak credentials
5. ✅ Deploy frontend

## Pros of This Approach

- ✅ No GitHub connection needed
- ✅ Full control over deployments
- ✅ Can use private images
- ✅ Easy to version with Docker tags
- ✅ Can deploy from any CI/CD pipeline

## Cons

- ❌ Manual service creation (13 services)
- ❌ Need to maintain Docker images
- ❌ No automatic redeploy on code changes
- ❌ Environment variables must be updated manually

## Cost Comparison

Same as GitHub approach:
- **Free tier**: Limited hours per service
- **Starter plan**: ~$7/month per service × 8 = $56/month
- **Databases**: ~$7/month × 5 = $35/month
- **Total**: ~$91/month for production

## Updating Services

To update a service:

```bash
# 1. Rebuild and push image
docker build -f [dockerfile-path] -t [username]/myb-[service]:latest .
docker push [username]/myb-[service]:latest

# 2. In Render dashboard, trigger manual deploy
# Or use Render CLI: render deploy
```

## Render CLI Alternative

Install Render CLI:

```bash
# Install
npm install -g @render/cli

# Login
render login

# Create service from local
render create web --name myb-service --image [docker-image]
```

Render CLI documentation: https://render.com/docs/cli

---

**This approach gives you full control without GitHub dependency!**
