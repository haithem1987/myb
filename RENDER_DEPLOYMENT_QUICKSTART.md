# 🚀 Render Deployment Quick Start

## ✅ Status: Ready to Deploy

All Render deployment files have been created and pushed to GitHub!

### 📦 What Was Created:

1. **[render.yaml](render.yaml)** - Blueprint configuration with 13 services + 5 databases
2. **[docs/RENDER_DEPLOYMENT_GUIDE.md](docs/RENDER_DEPLOYMENT_GUIDE.md)** - Complete deployment documentation
3. **[scripts/render-deploy.sh](scripts/render-deploy.sh)** - Interactive deployment helper
4. **[.env.render.template](.env.render.template)** - Environment variables template

### 🎯 Next Steps:

#### 1. Go to Render Dashboard
Visit: https://dashboard.render.com

#### 2. Create New Blueprint
1. Click **"New"** → **"Blueprint"**
2. Select **"Connect a repository"**
3. Choose your GitHub repository: `haithem1987/myb`
4. Render will auto-detect `render.yaml`
5. Click **"Apply"**

#### 3. Configure Environment Variables

After blueprint creation, configure these in Render dashboard:

```bash
# Keycloak (will be available after first deployment)
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=[secure-password]
KEYCLOAK_HOSTNAME_URL=https://myb-keycloak-xxxx.onrender.com
KEYCLOAK_URL=https://myb-keycloak-xxxx.onrender.com
KEYCLOAK_CLIENT_ID=MYB-client
KEYCLOAK_CLIENT_SECRET=[from-keycloak-admin]

# Payment Service
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxx

# Notification Service
SENDGRID_API_KEY=SG.xxxx
EMAIL_FROM_ADDRESS=noreply@myb.com

# Frontend
API_BASE_URL=https://myb-frontend-xxxx.onrender.com
```

#### 4. Initial Deployment Order

Render will deploy in this order automatically:
1. ✅ Databases (5 PostgreSQL instances)
2. ✅ Keycloak (wait for URL)
3. ✅ Backend Services (7 microservices)
4. ✅ Frontend (Angular app)

#### 5. Post-Deployment Configuration

##### A. Configure Keycloak Realm
```bash
# Access Keycloak admin console
https://myb-keycloak-xxxx.onrender.com/admin

# Login with KEYCLOAK_ADMIN_USER credentials
# Create/Import MYB realm
# Create OAuth2 client
# Note down client secret
```

##### B. Update Environment Variables
After Keycloak is deployed:
1. Get Keycloak URL from Render dashboard
2. Update all services with correct `KEYCLOAK_URL`
3. Update with Keycloak client secret
4. Redeploy affected services

##### C. Run Database Migrations
For each .NET service, migrations may need to be run manually:
- User Manager (uses timesheetDB)
- Timesheet
- Document Manager
- Invoice
- Coproperty

Check service logs in Render dashboard for migration status.

### 🔧 Deployment Helper Commands

Use the interactive script for pre-deployment checks:

```bash
./scripts/render-deploy.sh
```

Options:
1. **Generate environment variables template** - Get .env.render.template
2. **Validate render.yaml syntax** - ✅ Already validated!
3. **Check prerequisites** - Verify Dockerfiles exist
4. **Display service information** - View architecture
5. **Create .env.render file** - Local reference

### 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   RENDER DEPLOYMENT                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🗄️  DATABASES (5)                                  │
│  ├── keycloak-db     (PostgreSQL 16)               │
│  ├── timesheet-db    (PostgreSQL 16)               │
│  ├── document-db     (PostgreSQL 16)               │
│  ├── invoice-db      (PostgreSQL 16)               │
│  └── coproperty-db   (PostgreSQL 16)               │
│                                                     │
│  🔐 AUTH SERVICE (1)                                │
│  └── myb-keycloak    (Keycloak 23.0.4)             │
│                                                     │
│  ⚙️  BACKEND SERVICES (7)                           │
│  ├── myb-usermanager     (.NET 10)                 │
│  ├── myb-timesheet       (.NET 10)                 │
│  ├── myb-docmanager      (.NET 10)                 │
│  ├── myb-invoice         (.NET 10)                 │
│  ├── myb-payment         (.NET 10)                 │
│  ├── myb-notification    (.NET 10)                 │
│  └── myb-coproperty      (.NET 10)                 │
│                                                     │
│  🌐 FRONTEND (1)                                    │
│  └── myb-frontend    (Angular 21 + Nginx)          │
│                                                     │
└─────────────────────────────────────────────────────┘

Total: 18 Resources (5 DBs + 13 Web Services)
```

### 💰 Cost Estimation

**Development/Staging** (Free Tier):
- Limited to 750 hours/month per service
- 90-day database retention
- Good for testing

**Production** (Standard Plan):
- ~$7/month per web service × 8 = $56
- ~$7/month per database × 5 = $35
- **Total: ~$91/month**

### 🔍 Monitoring & Logs

After deployment, monitor in Render dashboard:
- Service health status
- Deployment logs
- Runtime logs
- Metrics & analytics

### 📚 Resources

- **Full Guide**: [docs/RENDER_DEPLOYMENT_GUIDE.md](docs/RENDER_DEPLOYMENT_GUIDE.md)
- **Render Docs**: https://render.com/docs
- **Blueprint Spec**: https://render.com/docs/infrastructure-as-code

### ⚠️ Important Notes

1. **First deployment** takes ~20-30 minutes
2. **Keycloak URL** needed before other services work properly
3. **Database migrations** may require manual intervention
4. **CORS settings** must be configured in Keycloak
5. **SSL certificates** auto-provisioned by Render
6. **Custom domains** can be added after deployment

### 🆘 Troubleshooting

**Services failing to start?**
- Check environment variables are set
- Verify databases are healthy
- Check service logs for errors

**Can't access Keycloak?**
- Wait 3-5 minutes for initialization
- Check health check is passing
- Verify DNS propagation

**Database connection errors?**
- Ensure database is running first
- Verify connection string format
- Check IP allowlist settings

### ✅ Deployment Checklist

- [x] render.yaml created
- [x] Deployment guide written
- [x] Helper script created
- [x] Environment template generated
- [x] .gitignore updated
- [x] Files pushed to GitHub
- [ ] Render Blueprint created
- [ ] Environment variables configured
- [ ] Keycloak realm set up
- [ ] Services deployed
- [ ] Database migrations run
- [ ] Frontend tested
- [ ] OAuth flow verified

---

**Ready to deploy!** 🎉

Go to: https://dashboard.render.com/blueprints/new
