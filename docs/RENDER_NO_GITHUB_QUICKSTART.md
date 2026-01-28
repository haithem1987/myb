# 🐳 Deploy to Render Without GitHub - Quick Reference

## Method: Docker Hub + Manual Service Creation

### Step 1: Build & Push Images (15-30 min)

```bash
# Login to Docker Hub
docker login

# Build and push all services
./scripts/docker-push-all.sh YOUR-DOCKERHUB-USERNAME

# Example:
./scripts/docker-push-all.sh johndoe
```

This creates 8 images:
- `YOUR-USERNAME/myb-usermanager:latest`
- `YOUR-USERNAME/myb-timesheet:latest`
- `YOUR-USERNAME/myb-docmanager:latest`
- `YOUR-USERNAME/myb-invoice:latest`
- `YOUR-USERNAME/myb-payment:latest`
- `YOUR-USERNAME/myb-notification:latest`
- `YOUR-USERNAME/myb-coproperty:latest`
- `YOUR-USERNAME/myb-frontend:latest`

### Step 2: Create Databases on Render (5 min)

Go to: https://dashboard.render.com/new/database

Create 5 PostgreSQL databases:

| Name | Database | User | Plan |
|------|----------|------|------|
| keycloak-db | keycloak | keycloak | Free |
| timesheet-db | timesheetDB | postgres | Free |
| document-db | documentDB | postgres | Free |
| invoice-db | invoiceDB | postgres | Free |
| coproperty-db | copropertyDB | postgres | Free |

**Save all connection strings!**

### Step 3: Deploy Keycloak (5 min)

Go to: https://dashboard.render.com/select-repo?type=web

Select: **"Deploy an existing image from a registry"**

```
Image URL: quay.io/keycloak/keycloak:23.0.4
Name: myb-keycloak
Region: Oregon
Plan: Starter

Docker Command: start --db=postgres

Environment Variables:
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=YourSecurePassword123
KC_DB=postgres
KC_DB_URL=[paste-keycloak-db-connection-string]
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=[keycloak-db-password]
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
KC_HOSTNAME_STRICT_HTTPS=false
```

Wait for Keycloak to deploy and note the URL (e.g., `https://myb-keycloak-xxxx.onrender.com`)

### Step 4: Configure Keycloak (5 min)

1. Go to `https://myb-keycloak-xxxx.onrender.com/admin`
2. Login (admin / YourSecurePassword123)
3. Create realm: `MYB`
4. Create client: `MYB-client`
5. Set client type: `OpenID Connect`
6. Enable: Client authentication
7. Add redirect URIs:
   - `https://myb-frontend-*.onrender.com/*`
   - `http://localhost:4200/*`
8. Copy **Client Secret** (you'll need this!)

### Step 5: Deploy Backend Services (30 min)

For each service, create a new web service:

#### Template for All Backend Services:

```
Image URL: YOUR-USERNAME/myb-[SERVICE-NAME]:latest
Name: myb-[service-name]
Region: Oregon
Plan: Starter

Common Environment Variables (for all):
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
Keycloak__BaseUrl=https://myb-keycloak-xxxx.onrender.com/realms/MYB/protocol/openid-connect
Keycloak__Authority=https://myb-keycloak-xxxx.onrender.com/realms/MYB
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=[paste-from-keycloak]
```

#### Service-Specific Variables:

**User Manager** (`myb-usermanager`):
```
ConnectionStrings__UserDBConnection=[timesheet-db-connection-string]
```

**Timesheet** (`myb-timesheet`):
```
ConnectionStrings__TimesheetDBConnection=[timesheet-db-connection-string]
```

**Document Manager** (`myb-docmanager`):
```
ConnectionStrings__DocumentDBConnection=[document-db-connection-string]
```

**Invoice** (`myb-invoice`):
```
ConnectionStrings__InvoiceDBConnection=[invoice-db-connection-string]
```

**Payment** (`myb-payment`):
```
Stripe__SecretKey=sk_test_YOUR_KEY
Stripe__PublishableKey=pk_test_YOUR_KEY
```

**Notification** (`myb-notification`):
```
SendGrid__ApiKey=SG.YOUR_KEY
Email__FromAddress=noreply@myb.com
```

**Coproperty** (`myb-coproperty`):
```
ConnectionStrings__CopropertyDBConnection=[coproperty-db-connection-string]
```

### Step 6: Deploy Frontend (5 min)

```
Image URL: YOUR-USERNAME/myb-frontend:latest
Name: myb-frontend
Region: Oregon
Plan: Starter

Environment Variables:
NODE_ENV=production
KEYCLOAK_URL=https://myb-keycloak-xxxx.onrender.com
KEYCLOAK_REALM=MYB
KEYCLOAK_CLIENT_ID=MYB-client
```

### Step 7: Verify & Test (10 min)

1. All services should be in "Live" status
2. Check logs for errors
3. Access frontend: `https://myb-frontend-xxxx.onrender.com`
4. Test login with Keycloak

---

## Quick Commands

```bash
# Build and push all images
./scripts/docker-push-all.sh YOUR-USERNAME

# Update a single service
docker build -f src/services/invoice-management/Myb.Invoice/Dockerfile \
  -t YOUR-USERNAME/myb-invoice:latest .
docker push YOUR-USERNAME/myb-invoice:latest

# Then in Render dashboard: Manual Deploy → Deploy latest commit
```

## Total Time Estimate

- Image build & push: ~20-30 min
- Database creation: ~5 min
- Keycloak setup: ~10 min
- Backend services: ~30 min
- Frontend: ~5 min

**Total: ~70-80 minutes**

## Cost (Same as GitHub approach)

- 8 web services × $7 = $56/month
- 5 databases × $7 = $35/month
- **Total: ~$91/month**

Free tier available but limited to 750 hours/month per service.

---

## Pros ✅

- No GitHub required
- Full control over images
- Can use private Docker registry
- Version control with Docker tags
- CI/CD friendly

## Cons ❌

- Manual service creation (one-time)
- Must rebuild & push images for updates
- No auto-deploy on code changes
- Environment variables managed manually

---

**For full details, see:** [docs/RENDER_DEPLOYMENT_WITHOUT_GITHUB.md](docs/RENDER_DEPLOYMENT_WITHOUT_GITHUB.md)
