# 🚨 Railway 502 Error Fix - Quick Guide

## The Problem

You're seeing **502 Bad Gateway** errors on your Railway deployment for:
- `myb-admin` (Admin Frontend)
- `myb-coproperty` (Backend API)

## Root Cause

Railway is deploying the **WRONG DOCKERFILE** for the admin frontend service.

**What's happening:**
- Admin service is building with the backend Dockerfile
- This starts a .NET Kestrel server instead of nginx
- Angular app never gets served → 502 error

## The Fix (5 Minutes)

### Step 1: Fix Admin Frontend Dockerfile Path

1. **Open Railway Dashboard**: https://railway.app/dashboard
2. **Click** on the `myb-admin` service (usually bottom-left)
3. **Click** "Settings" tab at the top
4. **Scroll down** to "Build" section
5. **Find** "Dockerfile Path" field
6. **Enter**: `Dockerfile.frontend`
7. **Scroll up** and click **"Redeploy"** (top right, purple button)
8. **Wait** 3-5 minutes for rebuild

### Step 2: Fix Keycloak Start Command

1. **Click** on the `keycloak` service
2. **Click** "Settings" tab
3. **Scroll down** to "Deploy" section
4. **Find** "Start Command" field
5. **Enter**: `start --db=postgres`
6. **Click** "Redeploy"
7. **Wait** 1-2 minutes

### Step 3: Verify Backend Configuration

1. **Click** on the `myb-coproperty` service
2. **Click** "Settings" → "Build"
3. **Verify** "Dockerfile Path" shows:
   ```
   src/services/coproperty-management/Myb.Coproperty/Dockerfile
   ```
4. If not, set it and redeploy

## Verification

After redeployment completes:

### Test Admin Frontend
```bash
curl https://myb-admin-production.up.railway.app/health
```
**Expected:** `healthy` (plain text)

**If you see:**
- `Application failed to respond` → Dockerfile path still wrong
- `502 Bad Gateway` → Still deploying, wait 1 more minute
- `.NET error` → Wrong Dockerfile, check path again

### Test Backend API
```bash
curl https://myb-coproperty-production.up.railway.app/health
```
**Expected:** `{"status":"healthy"}`

### Test Keycloak
Open in browser:
```
http://localhost:4200
```
**Expected:** Keycloak welcome page

## Check the Logs

Click on each service → "Deployments" → Click latest deployment → "View Logs"

### ✅ Good Admin Logs (nginx):
```
Server listening on port 8080
```

### ❌ Bad Admin Logs (.NET - WRONG!):
```
warn: Microsoft.AspNetCore.Server.Kestrel[0]
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

### ✅ Good Backend Logs:
```
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: http://[::]:8080
```

### ✅ Good Keycloak Logs:
```
Keycloak 23.0.4 on JVM started
Listening on http://0.0.0.0:8080
```

## Why This Happens

Railway auto-detects Dockerfiles from the repository root. Since your project has multiple Dockerfiles:

- `Dockerfile` (for backend - generic name)
- `Dockerfile.frontend` (for admin)
- `Dockerfile.client` (for client)

Railway picks the first one it finds (usually `Dockerfile`) unless you explicitly specify the path.

## Environment Variables to Check

Make sure these are set in each service:

### myb-admin
```bash
NODE_ENV=production
PORT=8080
```

### myb-coproperty
```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__CopropertyDBConnection=Host=${{coproperty-db.RAILWAY_PRIVATE_DOMAIN}};Port=5432;Database=copropertyDB;Username=postgres;Password=<your-password>
Keycloak__Authority=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB
Keycloak__BaseUrl=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB/protocol/openid-connect
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=f4umyKKCMYgaipA3f3MndHeTg8ubvyD2
```

### keycloak
```bash
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=<your-password>
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://${{keycloak-db.RAILWAY_PRIVATE_DOMAIN}}:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=<your-db-password>
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<your-password>
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
KC_HOSTNAME_STRICT_HTTPS=false
```

## Quick Checklist

- [ ] myb-admin Dockerfile Path = `Dockerfile.frontend`
- [ ] myb-coproperty Dockerfile Path = `src/services/coproperty-management/Myb.Coproperty/Dockerfile`
- [ ] keycloak Start Command = `start --db=postgres`
- [ ] All environment variables set correctly
- [ ] All services show "Active" status
- [ ] Health endpoints return success
- [ ] No 502 errors in browser

## Still Having Issues?

1. **Check deployment logs** for each service
2. **Verify database connectivity** - use Railway's private domain
3. **Ensure start commands** are correct
4. **Review environment variables** - check for typos
5. **Look at the full deployment guide**: `docs/RAILWAY_DEPLOYMENT_GUIDE.md`

## Railway Service Architecture

```
myb-admin (Frontend)
  ├─ Uses: Dockerfile.frontend
  ├─ Builds: Angular NX app
  └─ Serves: nginx on port 8080

myb-coproperty (Backend)
  ├─ Uses: src/services/coproperty-management/Myb.Coproperty/Dockerfile
  ├─ Builds: .NET 8 API
  └─ Serves: Kestrel on port 8080

keycloak (Auth)
  ├─ Uses: quay.io/keycloak/keycloak:23.0.4 (Docker image)
  ├─ Command: start --db=postgres
  └─ Serves: Keycloak on port 8080

coproperty-db (Database)
  └─ Uses: postgres:16.2

keycloak-db (Database)
  └─ Uses: postgres:16.2
```

---

**That's it!** After setting the correct Dockerfile paths and redeploying, your 502 errors should be resolved. 🎉
