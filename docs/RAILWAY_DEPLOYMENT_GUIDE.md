# 🚂 MYB Railway Deployment Guide

Complete guide for deploying MYB Coproperty Management System to Railway following the docker-compose architecture.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Environment Variables Configuration](#environment-variables-configuration)
6. [Troubleshooting 502 Errors](#troubleshooting-502-errors)
7. [Verification](#verification)

---

## 🎯 Overview

This deployment includes:

- **myb-admin** - Angular NX admin frontend (port 8080)
- **myb-coproperty** - .NET GraphQL backend API (port 8080) 
- **keycloak** - Authentication service (port 8080)
- **coproperty-db** - PostgreSQL 16.2 database
- **keycloak-db** - PostgreSQL 16.2 database

## ✅ Prerequisites

Before deploying, ensure you have:

1. **Railway Account** - [Sign up at railway.app](https://railway.app)
2. **Railway CLI** - Will be installed by deployment script
3. **Git Repository** - Code pushed to GitHub/GitLab
4. **Environment Variables** - Prepared secure passwords

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌─────────────────┐                │
│  │ myb-admin    │─────▶│  myb-coproperty │                │
│  │ (Angular NX) │      │  (.NET GraphQL) │                │
│  │ Port: 8080   │      │  Port: 8080     │                │
│  └──────┬───────┘      └────────┬────────┘                │
│         │                       │                          │
│         │                       │                          │
│         ▼                       ▼                          │
│  ┌──────────────┐      ┌─────────────────┐                │
│  │  keycloak    │      │ coproperty-db   │                │
│  │  (Auth)      │      │ (PostgreSQL)    │                │
│  │  Port: 8080  │      │ Port: 5432      │                │
│  └──────┬───────┘      └─────────────────┘                │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │ keycloak-db  │                                          │
│  │ (PostgreSQL) │                                          │
│  │ Port: 5432   │                                          │
│  └──────────────┘                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Step-by-Step Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Clone repository
cd /Volumes/NidhalSSD/Projects/myb

# Run deployment script
bash scripts/deploy-railway.sh
```

The script will:
1. ✅ Install Railway CLI if needed
2. ✅ Login to Railway
3. ✅ Deploy all 5 services in correct order
4. ✅ Wait for dependencies to be ready
5. ✅ Open Railway dashboard

### Option 2: Manual Deployment via Railway Dashboard

#### Step 1: Create New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Empty Project"**
4. Name it: `myb-production`

#### Step 2: Deploy Databases First

**Keycloak Database:**
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Name: `keycloak-db`
3. In Variables tab, add:
   ```
   POSTGRES_DB=keycloak
   POSTGRES_USER=keycloak
   POSTGRES_PASSWORD=<secure-password>
   ```

**Coproperty Database:**
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Name: `coproperty-db`
3. In Variables tab, add:
   ```
   POSTGRES_DB=copropertyDB
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=<secure-password>
   ```

#### Step 3: Deploy Keycloak

1. Click **"+ New"** → **"Empty Service"**
2. Name: `keycloak`
3. In **Settings** → **Deploy**:
   - **Image**: `quay.io/keycloak/keycloak:23.0.4`
   - **Start Command**: `start --db=postgres`
4. In **Variables** tab, add:

```bash
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=<secure-password>
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://${{keycloak-db.RAILWAY_PRIVATE_DOMAIN}}:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=<same-as-keycloak-db-password>
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<same-as-bootstrap-password>
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
KC_HOSTNAME_STRICT_HTTPS=false
```

5. Click **"Deploy"**

#### Step 4: Deploy Coproperty Backend

1. Click **"+ New"** → **"GitHub Repo"** (or GitLab)
2. Select your `myb` repository
3. Name: `myb-coproperty`
4. In **Settings** → **Build**:
   - **Root Directory**: `/`
   - **Dockerfile Path**: `src/services/coproperty-management/Myb.Coproperty/Dockerfile`
5. In **Variables** tab, add:

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__CopropertyDBConnection=Host=${{coproperty-db.RAILWAY_PRIVATE_DOMAIN}};Port=5432;Database=copropertyDB;Username=postgres;Password=<coproperty-db-password>
Keycloak__Authority=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB
Keycloak__BaseUrl=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB/protocol/openid-connect
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=f4umyKKCMYgaipA3f3MndHeTg8ubvyD2
```

6. Click **"Deploy"**

#### Step 5: Deploy Admin Frontend

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your `myb` repository  
3. Name: `myb-admin`
4. In **Settings** → **Build**:
   - **Root Directory**: `/`
   - **Dockerfile Path**: `Dockerfile.frontend` ⚠️ **CRITICAL - This fixes the 502!**
5. In **Variables** tab, add:

```bash
NODE_ENV=production
PORT=8080
```

6. Click **"Deploy"**

---

## 🔧 Environment Variables Configuration

### Complete Variable Reference

#### Keycloak Service

```bash
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=SecurePassword123!
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://${{keycloak-db.RAILWAY_PRIVATE_DOMAIN}}:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=SecureKeycloakDbPassword123!
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=SecurePassword123!
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
KC_HOSTNAME_STRICT_HTTPS=false
```

#### Coproperty Backend

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__CopropertyDBConnection=Host=${{coproperty-db.RAILWAY_PRIVATE_DOMAIN}};Port=5432;Database=copropertyDB;Username=postgres;Password=SecureCopropertyDbPassword123!
Keycloak__Authority=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB
Keycloak__BaseUrl=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB/protocol/openid-connect
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=f4umyKKCMYgaipA3f3MndHeTg8ubvyD2
```

#### Admin Frontend

```bash
NODE_ENV=production
PORT=8080
```

#### Databases

**keycloak-db:**
```bash
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=SecureKeycloakDbPassword123!
```

**coproperty-db:**
```bash
POSTGRES_DB=copropertyDB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SecureCopropertyDbPassword123!
```

### Railway Variable Reference Syntax

Railway uses `${{service-name.VARIABLE}}` syntax:

- `${{keycloak-db.RAILWAY_PRIVATE_DOMAIN}}` - Private network hostname
- `${{keycloak.RAILWAY_PUBLIC_DOMAIN}}` - Public HTTPS URL
- `${{env.VARIABLE_NAME}}` - Reference shared variables

---

## 🔥 Troubleshooting 502 Errors

### Common Causes and Fixes

#### 1. **Wrong Dockerfile for Admin Frontend** ⚠️ MOST COMMON

**Problem:** Railway deployed backend Dockerfile instead of frontend

**Symptoms:**
- 502 Bad Gateway on admin URL
- Logs show `.NET Kestrel` instead of `nginx`

**Fix:**
1. Open Railway Dashboard
2. Click `myb-admin` service
3. Go to **Settings** → **Build**
4. Set **Dockerfile Path** to: `Dockerfile.frontend`
5. Click **"Redeploy"**

#### 2. **Keycloak Not Starting**

**Problem:** Missing start command

**Symptoms:**
- Keycloak shows "Completed" status
- Logs show help text

**Fix:**
1. Click `keycloak` service
2. Go to **Settings** → **Deploy**
3. Set **Start Command** to: `start --db=postgres`
4. Click **"Redeploy"**

#### 3. **Database Connection Failed**

**Problem:** Wrong connection string format

**Symptoms:**
- Backend crashes on startup
- Logs show "Failed to connect to database"

**Fix:**
Use Railway's private network:
```bash
Host=${{coproperty-db.RAILWAY_PRIVATE_DOMAIN}};Port=5432;...
```

NOT public URL:
```bash
# ❌ WRONG
Host=coproperty-db-production.railway.app;...
```

#### 4. **Port Mismatch**

**Problem:** Service listening on wrong port

**Symptoms:**
- Health checks fail
- Service marked as unhealthy

**Fix:**
All services must use `PORT=8080`:
```bash
ASPNETCORE_URLS=http://+:8080  # Backend
PORT=8080                       # Frontend
```

#### 5. **Keycloak Hostname Issues**

**Problem:** Strict hostname validation enabled

**Fix:**
Ensure these variables are set:
```bash
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
KC_HOSTNAME_STRICT_HTTPS=false
```

---

## ✅ Verification

### 1. Check Service Status

In Railway Dashboard, all services should show **"Active"** status:

```
✅ keycloak-db       Active
✅ coproperty-db     Active
✅ keycloak          Active
✅ myb-coproperty    Active
✅ myb-admin         Active
```

### 2. Test Health Endpoints

**Backend API:**
```bash
curl https://myb-coproperty-production.up.railway.app/health
# Should return: {"status":"healthy"}
```

**Admin Frontend:**
```bash
curl https://myb-admin-production.up.railway.app/health
# Should return: healthy
```

### 3. Test GraphQL Endpoint

```bash
curl -X POST https://myb-coproperty-production.up.railway.app/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { queryType { name } } }"}'
```

Should return GraphQL schema information.

### 4. Check Keycloak

Open in browser:
```
http://localhost:4200
```

Should show Keycloak welcome page.

### 5. Access Admin Panel

Open in browser:
```
https://myb-admin-production.up.railway.app
```

Should show Angular admin app login page.

### 6. Check Logs

For each service, check logs in Railway Dashboard:

**Good backend logs:**
```
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: http://[::]:8080
info: Microsoft.Hosting.Lifetime[0]
      Application started.
```

**Good frontend logs:**
```
Server listening on port 8080
```

**Good Keycloak logs:**
```
Keycloak 23.0.4 on JVM started
Listening on http://0.0.0.0:8080
```

---

## 🎯 Post-Deployment Configuration

### 1. Configure Keycloak Realm

1. Access Keycloak admin console
2. Create realm: `MYB`
3. Create client: `MYB-client`
4. Set valid redirect URIs:
   - `https://myb-admin-production.up.railway.app/*`
5. Copy client secret to backend variables

### 2. Run Database Migrations

```bash
railway run --service myb-coproperty dotnet ef database update
```

### 3. Create Admin User

Use Keycloak admin console or backend API to create first admin user.

---

## 📚 Additional Resources

- **Railway Documentation**: https://docs.railway.app
- **Dockerfile.frontend**: See file in project root
- **Docker Compose Reference**: See `docker-compose.yml`
- **Environment Variables**: See `.env.railway.example`

---

## 🆘 Getting Help

If you encounter issues:

1. Check service logs in Railway Dashboard
2. Verify all environment variables are set correctly
3. Ensure Dockerfile paths are correct
4. Check database connectivity
5. Review this guide's troubleshooting section

---

## ✨ Success Checklist

- [ ] All 5 services show "Active" status
- [ ] Health endpoints return success
- [ ] Backend GraphQL endpoint accessible
- [ ] Keycloak admin console loads
- [ ] Admin frontend shows login page
- [ ] No 502 errors
- [ ] Database connections working
- [ ] Keycloak realm configured
- [ ] Admin user created

---

**Deployment Complete! 🎉**

Your MYB Coproperty Management System is now running on Railway with proper architecture following docker-compose setup.
