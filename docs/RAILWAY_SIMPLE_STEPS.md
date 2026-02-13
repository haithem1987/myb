# 🚂 Railway Deployment - Simple Steps

## ⚡ Quick Setup (Follow in Order)

Railway doesn't support automated multi-service deployment via CLI. You **MUST** use the Railway Dashboard to create services manually.

### Step 1: Login to Railway

```bash
railway login
```

This opens your browser. Complete the login.

### Step 2: Open Railway Dashboard

Go to: **https://railway.app/dashboard**

Click **"+ New Project"** → **"Empty Project"**

Name it: `myb-production`

---

## 📦 Create Services (In This Order)

### 1. Create keycloak-db Database

1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway auto-names it `postgres` - rename to: **keycloak-db**
3. Click **"Variables"** tab
4. Add these variables:

```bash
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=YourSecurePassword123!
```

5. Click **"Deploy"**

---

### 2. Create coproperty-db Database

1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Rename to: **coproperty-db**
3. Click **"Variables"** tab
4. Add:

```bash
POSTGRES_DB=copropertyDB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YourSecurePassword123!
```

5. Click **"Deploy"**

---

### 3. Deploy Keycloak Service

1. Click **"+ New"** → **"Empty Service"**
2. Name: **keycloak**
3. Click **Settings** → **Deploy** section
4. Set:
   - **Image**: `quay.io/keycloak/keycloak:23.0.4`
   - **Start Command**: `start --db=postgres`

5. Click **"Variables"** tab
6. Add ALL these variables (copy-paste):

```bash
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=YourAdminPassword123!
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://${{keycloak-db.RAILWAY_PRIVATE_DOMAIN}}:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=YourSecurePassword123!
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=YourAdminPassword123!
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
KC_HOSTNAME_STRICT_HTTPS=false
```

**⚠️ Important:** 
- `KC_DB_PASSWORD` must match the password you set in keycloak-db
- `KC_BOOTSTRAP_ADMIN_PASSWORD` and `KEYCLOAK_ADMIN_PASSWORD` must be the same

7. Click **"Deploy"**

---

### 4. Deploy Backend (myb-coproperty)

1. Click **"+ New"** → **"GitHub Repo"** (or GitLab)
2. Select your **myb** repository
3. Name: **myb-coproperty**
4. Click **Settings** → **Build** section
5. Set:
   - **Root Directory**: leave empty or `/`
   - **Dockerfile Path**: `src/services/coproperty-management/Myb.Coproperty/Dockerfile`

6. Click **"Variables"** tab
7. Add these variables:

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__CopropertyDBConnection=Host=${{coproperty-db.RAILWAY_PRIVATE_DOMAIN}};Port=5432;Database=copropertyDB;Username=postgres;Password=YourSecurePassword123!
Keycloak__Authority=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB
Keycloak__BaseUrl=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB/protocol/openid-connect
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=f4umyKKCMYgaipA3f3MndHeTg8ubvyD2
```

**⚠️ Important:**
- Replace `YourSecurePassword123!` with the password you used for coproperty-db
- The `${{service.RAILWAY_PRIVATE_DOMAIN}}` syntax is Railway's way to reference other services

8. Click **"Deploy"**

---

### 5. Deploy Frontend (myb-admin)

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your **myb** repository again
3. Name: **myb-admin**
4. Click **Settings** → **Build** section
5. Set:
   - **Root Directory**: leave empty or `/`
   - **Dockerfile Path**: `Dockerfile.frontend` ← **THIS IS CRITICAL!**

6. Click **"Variables"** tab
7. Add:

```bash
NODE_ENV=production
PORT=8080
```

8. Click **"Deploy"**

---

## ✅ Verification

After all services are deployed (wait 5-10 minutes):

### Check Service Status

All should show **"Active"** status in Railway dashboard:
- ✅ keycloak-db
- ✅ coproperty-db
- ✅ keycloak
- ✅ myb-coproperty
- ✅ myb-admin

### Test Endpoints

**Backend Health:**
```bash
curl https://myb-coproperty-production.up.railway.app/health
```
Should return: `{"status":"healthy"}`

**Frontend Health:**
```bash
curl https://myb-admin-production.up.railway.app/health
```
Should return: `healthy`

**Keycloak:**

Open in browser: `https://keycloak-production.up.railway.app`

Should show Keycloak welcome page.

---

## 🔥 Common Issues

### Issue: 502 Bad Gateway on myb-admin

**Cause:** Wrong Dockerfile path

**Fix:**
1. Click `myb-admin` service
2. Settings → Build
3. Make sure Dockerfile Path is: `Dockerfile.frontend`
4. Click "Redeploy"

### Issue: Keycloak shows "Completed" status

**Cause:** Missing start command

**Fix:**
1. Click `keycloak` service
2. Settings → Deploy
3. Set Start Command: `start --db=postgres`
4. Click "Redeploy"

### Issue: Backend can't connect to database

**Cause:** Wrong connection string

**Fix:**

Make sure you're using `RAILWAY_PRIVATE_DOMAIN`:
```bash
Host=${{coproperty-db.RAILWAY_PRIVATE_DOMAIN}};Port=5432;...
```

NOT the public URL.

---

## 📚 Full Documentation

- **Complete Guide:** [docs/RAILWAY_DEPLOYMENT_GUIDE.md](../RAILWAY_DEPLOYMENT_GUIDE.md)
- **502 Error Fix:** [docs/RAILWAY_502_FIX.md](../RAILWAY_502_FIX.md)
- **Quick Reference:** [docs/RAILWAY_QUICK_REFERENCE.md](../RAILWAY_QUICK_REFERENCE.md)

---

## 🎯 Summary

**What you need:**
- Railway account (free tier works)
- GitHub/GitLab repository with your code
- 15 minutes to set up via dashboard

**Services to create:**
1. keycloak-db (PostgreSQL)
2. coproperty-db (PostgreSQL)
3. keycloak (Docker image)
4. myb-coproperty (from GitHub)
5. myb-admin (from GitHub)

**Most common mistake:**
❌ Using wrong Dockerfile for myb-admin
✅ Must use `Dockerfile.frontend`

---

**Ready?** Go to https://railway.app/dashboard and follow the steps above!
