# 📋 Railway Deployment - Quick Reference Card

## 🎯 Service Overview

| Service | Type | Port | Dockerfile/Image |
|---------|------|------|------------------|
| **myb-admin** | Frontend (Angular) | 8080 | `Dockerfile.frontend` |
| **myb-coproperty** | Backend (.NET) | 8080 | `src/services/coproperty-management/Myb.Coproperty/Dockerfile` |
| **keycloak** | Auth Service | 8080 | `quay.io/keycloak/keycloak:23.0.4` |
| **coproperty-db** | PostgreSQL | 5432 | `postgres:16.2` |
| **keycloak-db** | PostgreSQL | 5432 | `postgres:16.2` |

## 🚀 Quick Deploy Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Automated deployment
bash scripts/deploy-railway.sh

# Check service status
railway status

# View logs
railway logs --service myb-admin
railway logs --service myb-coproperty
railway logs --service keycloak

# Open dashboard
railway open
```

## 🔧 Critical Configuration

### myb-admin (Frontend)

**Settings → Build:**
```
Dockerfile Path: Dockerfile.frontend
```

**Variables:**
```bash
NODE_ENV=production
PORT=8080
```

### myb-coproperty (Backend)

**Settings → Build:**
```
Dockerfile Path: src/services/coproperty-management/Myb.Coproperty/Dockerfile
```

**Variables:**
```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__CopropertyDBConnection=Host=${{coproperty-db.RAILWAY_PRIVATE_DOMAIN}};Port=5432;Database=copropertyDB;Username=postgres;Password=<password>
Keycloak__Authority=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB
Keycloak__BaseUrl=https://${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB/protocol/openid-connect
Keycloak__ClientId=MYB-client
Keycloak__ClientSecret=f4umyKKCMYgaipA3f3MndHeTg8ubvyD2
```

### keycloak

**Settings → Deploy:**
```
Start Command: start --db=postgres
```

**Variables:**
```bash
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=<password>
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://${{keycloak-db.RAILWAY_PRIVATE_DOMAIN}}:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=<password>
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<password>
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
KC_HOSTNAME_STRICT_HTTPS=false
```

### coproperty-db

**Variables:**
```bash
POSTGRES_DB=copropertyDB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<password>
```

### keycloak-db

**Variables:**
```bash
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=<password>
```

## ✅ Health Check URLs

```bash
# Admin Frontend
curl https://myb-admin-production.up.railway.app/health
# Expected: "healthy"

# Backend API
curl https://myb-coproperty-production.up.railway.app/health
# Expected: {"status":"healthy"}

# Keycloak
curl https://keycloak-production.up.railway.app
# Expected: Keycloak HTML page
```

## 🔥 Common Issues → Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| 502 on admin | Set Dockerfile Path to `Dockerfile.frontend` |
| 502 on backend | Check database connection string uses `RAILWAY_PRIVATE_DOMAIN` |
| Keycloak "Completed" status | Set Start Command to `start --db=postgres` |
| Database connection failed | Use `${{db-service.RAILWAY_PRIVATE_DOMAIN}}` not public URL |
| Port binding error | Ensure `PORT=8080` or `ASPNETCORE_URLS=http://+:8080` |

## 📊 Railway Variable Reference

```bash
# Private network (for service-to-service)
${{coproperty-db.RAILWAY_PRIVATE_DOMAIN}}  # Example: coproperty-db.railway.internal

# Public HTTPS URL
${{keycloak.RAILWAY_PUBLIC_DOMAIN}}  # Example: keycloak-production.up.railway.app

# Shared environment variable
${{env.KEYCLOAK_ADMIN_PASSWORD}}
```

## 🛠️ Deploy/Redeploy Process

1. Make changes in Railway Dashboard
2. Click **"Redeploy"** button (top right)
3. Wait for build (3-5 min for apps, 1-2 min for configs)
4. Check deployment logs
5. Test health endpoint
6. Verify in browser

## 📦 Deployment Order

**Follow this order for initial deployment:**

1. **keycloak-db** (Database)
2. **coproperty-db** (Database)
3. **keycloak** (Auth - depends on keycloak-db)
4. **myb-coproperty** (Backend - depends on coproperty-db + keycloak)
5. **myb-admin** (Frontend - consumes backend + keycloak)

**Wait time between steps:** 
- After databases: 30 seconds
- After keycloak: 45 seconds
- After backend: 30 seconds

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong passwords (16+ chars, mixed case, symbols)
- [ ] Set Keycloak client secret
- [ ] Enable HTTPS redirect in keycloak
- [ ] Configure CORS for admin panel
- [ ] Restrict database access to private network
- [ ] Review keycloak realm configuration

## 📝 Configuration Files

```
railway-admin-frontend.toml        # Admin frontend config
railway-coproperty-backend.toml    # Backend API config
railway-keycloak.toml               # Keycloak config
railway-keycloak-db.toml            # Keycloak database config
railway-coproperty-db.toml          # Coproperty database config
.env.railway.example                # Environment variables template
```

## 🎓 Useful Railway Commands

```bash
# Link to existing project
railway link

# Create new service
railway service create

# List all services
railway service list

# Set environment variable
railway variables set KEY=value --service myb-admin

# Get environment variables
railway variables --service myb-admin

# Run command in Railway environment
railway run npm install

# Shell into service
railway shell --service myb-coproperty
```

## 📚 Documentation Links

- Full Deployment Guide: `docs/RAILWAY_DEPLOYMENT_GUIDE.md`
- 502 Error Fix: `docs/RAILWAY_502_FIX.md`
- Environment Variables: `.env.railway.example`
- Railway Docs: https://docs.railway.app

## 🎯 Success Indicators

All these should be true:

- ✅ All services show "Active" status
- ✅ Health endpoints return success
- ✅ No 502 errors
- ✅ Logs show proper startup messages
- ✅ Can access admin panel
- ✅ Backend GraphQL accessible
- ✅ Keycloak admin console loads
- ✅ Database queries successful

---

**Quick Start:** Run `bash scripts/deploy-railway.sh` OR follow `docs/RAILWAY_DEPLOYMENT_GUIDE.md`
