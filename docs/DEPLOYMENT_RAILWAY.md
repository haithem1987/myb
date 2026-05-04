# 🚀 MYB Project - Deployment Guide

## Quick Deployment to Railway (Fastest)

### Prerequisites
- [Railway CLI](https://docs.railway.app/cli/install) installed
- GitHub account with project repo
- Docker installed (for local testing)

---

## **Option 1: One-Command Deploy (Recommended)**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
cd /Volumes/NidhalSSD/Projects/myb
railway init

# 4. Deploy!
railway up
```

✅ **Done!** Access your app at:
- **Admin Panel:** `https://your-project.railway.app`
- **API:** `https://your-project.railway.app/graphql`
- **Keycloak:** `https://keycloak-yourproject.railway.app`

---

## **Option 2: Deploy via GitHub (Auto CI/CD)**

### Setup Steps:

1. **Push to GitHub**
```bash
git push origin feature/coproperty-owner-actions
```

2. **Connect to Railway**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub"
   - Select your repo: `myb`
   - Select branch: `feature/coproperty-owner-actions`

3. **Configure Environment Variables**
   - Click "Add Variables"
   - Set these values:

```bash
KEYCLOAK_ADMIN_USER: admin
KEYCLOAK_ADMIN_PASSWORD: YourSecurePassword123!
KEYCLOAK_CLIENT_SECRET: f4umyKKCMYgaipA3f3MndHeTg8ubvyD2
KEYCLOAK_DB_PASSWORD: secure-db-password
COPROPERTY_DB_PASSWORD: secure-db-password
ASPNETCORE_ENVIRONMENT: Production
```

4. **Deploy**
   - Railway auto-deploys when you push to main/master
   - Or manually deploy from dashboard

---

## **Environment Variables Setup**

Create `.env.railway` with:

```env
# Keycloak
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=YourSecurePassword123!
KEYCLOAK_CLIENT_SECRET=f4umyKKCMYgaipA3f3MndHeTg8ubvyD2
KEYCLOAK_DB_PASSWORD=keycloak-db-pwd123!

# Coproperty Service
COPROPERTY_DB_PASSWORD=coproperty-db-pwd123!
COPROPERTY_DB_NAME=copropertyDB
COPROPERTY_DB_USER=postgres

# ASP.NET
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080

# Frontend
PRODUCTION=true
NODE_ENV=production
API_GATEWAY_URL=https://api.your-domain.railway.app
KEYCLOAK_URL=https://keycloak.your-domain.railway.app
```

---

## **Docker Services Deployed**

### **1. Admin Frontend (Port 80)**
- Built with NX + Angular
- Route: `/` 
- Auto-builds from `src/front/myb.front/apps/admin`

### **2. Coproperty Backend API (Port 8080)**
- .NET 8 + GraphQL
- Route: `/graphql`
- Handles all business logic

### **3. Keycloak (Port 8080)**
- Authentication/SSO
- Admin panel: `/admin`
- OpenID Connect provider

### **4. Databases (PostgreSQL)**
- `keycloak-db` - Keycloak data
- `copropertyDB` - Coproperty data

---

## **Post-Deployment Steps**

### 1. **Configure Keycloak (First Time)**

```bash
# Access Keycloak Admin
https://keycloak-your-app.railway.app/admin
# Login with KEYCLOAK_ADMIN_USER / KEYCLOAK_ADMIN_PASSWORD
```

- Import realm from `keycloak-db-init/` folder
- Create OAuth client for Angular frontend
- Set valid redirect URIs

### 2. **Verify Connectivity**

```bash
# Test Admin Frontend
curl https://your-app.railway.app

# Test GraphQL API
curl -X POST https://your-app.railway.app:8088/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# Test Keycloak
curl https://keycloak-your-app.railway.app/health
```

### 3. **Monitor Logs**

```bash
# View real-time logs
railway logs

# View specific service logs
railway logs --service admin-frontend
railway logs --service coproperty-backend
railway logs --service keycloak
```

---

## **Performance Optimization**

### Frontend (Admin App)
```bash
# Build with optimization
npx nx build admin --prod --optimization

# Check bundle size
npx nx build admin --prod --statsJson
```

### Backend
- Enable response caching
- Query result caching in GraphQL
- Database connection pooling

---

## **Troubleshooting**

### Admin App Not Loading

```bash
# Check frontend logs
railway logs --service admin-frontend

# Verify build
npx nx build admin --prod
```

### GraphQL Query Failing

```bash
# Check API logs
railway logs --service coproperty-backend

# Verify types
docker-compose -f docker-compose.deploy.yml up myb-coproperty
# Check http://localhost:8088/graphql
```

### Database Connection Issues

```bash
# Check DB logs
railway logs --service copropertyDB

# Verify connection string in logs
SHOW client_encoding;
```

---

## **Scaling (Beyond Demo)**

For production scale:

```bash
# Add more replicas
railway add-replica admin-frontend
railway add-replica coproperty-backend

# Enable auto-scaling
railway config set max-replicas 5
railway config set min-replicas 2

# Add CDN
railway add-plugin cloudflare-cdn
```

---

## **Cost Estimate (Railway Free Tier)**

- **Free Tier Includes:**
  - 5GB/month bandwidth
  - 1 vCPU
  - 4GB RAM total
  - PostgreSQL database (~10GB)
  - Basic monitoring

- **If Exceeding Free:**
  - ~$5/month per service for small usage
  - Employee dashboard uses <100MB RAM
  - Perfect for demos/internal tools

---

## **Custom Domain Setup**

1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Railway dashboard:
   - Go to "Domains"
   - Add: `myb.forlink.com`
   - Railway auto-provisions SSL certificate
3. Point DNS:
   - CNAME: `myb.forlink.com` → `your-railway-domain.railway.app`

---

## **Backup & Recovery**

```bash
# Backup Keycloak database
railway exec keycloak-db pg_dump -U keycloak keycloak > keycloak-backup.sql

# Backup Coproperty database  
railway exec copropertyDB pg_dump -U postgres copropertyDB > coproperty-backup.sql

# Restore from backup
railway exec keycloak-db psql -U keycloak keycloak < keycloak-backup.sql
```

---

## **Support**

- **Railway Docs:** https://docs.railway.app
- **GitHub Issues:** Link to your repo issues
- **Admin Email:** your-email@company.com

---

**🎉 Deployment Complete!**

Your boss can now visit: **https://your-app-name.railway.app**
