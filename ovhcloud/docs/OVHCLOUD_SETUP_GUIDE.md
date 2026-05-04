# OVHcloud Setup Checklist for MYB Deployment

Account: **haithem khalifa** (haithem.khalifa@forlink-group.com)

> **Current Status (April 28, 2026):** Infrastructure provisioned. Ready to build & deploy.

---

## Phase 1: Create Public Cloud Project ✅ DONE

**Project name:** `MYB`

~~Step 1.1 / 1.2 — completed~~

---

## Phase 2: Create Managed Kubernetes Cluster ✅ DONE

**Cluster:** `myb-coproperty-k8s`  
**ID:** `011d357c-71f3-4153-831a-051c9c7b...`  
**Kubernetes version:** 1.35.2-1  
**Region:** SBG5 (Strasbourg)  
**Plan:** Free  
**Status:** OK ✅  
**API URL:** `ebak4v.c1.sbg5.k8s.ovh.net`

### Step 2.2: Configure kubectl (⚠️ do this if not done)

The kubeconfig file (`kubeconfig-ebak4v.yml`) is already in your repo at `ovhcloud/kubeconfig-ebak4v.yml`.

```bash
export KUBECONFIG=/Volumes/NidhalSSD/Projects/myb/ovhcloud/kubeconfig-ebak4v.yml

# Verify
kubectl cluster-info
kubectl get nodes
```

---

## Phase 3: Create Managed PostgreSQL Database ✅ DONE

**Instance:** `myb-instance-db`  
**Engine:** PostgreSQL 16  
**Plan:** Essential (Db1-4)  
**Region:** Frankfurt (DE1)  
**Status:** Available ✅  
**Host:** `postgresql-72268bd4-oc862fcb1.database.cloud.ovh.net`  
**Port:** `20184`  
**SSL Mode:** require  
**Databases:** 3 created (copropertyDB, invoiceDB, keycloak) ✅  
**Users:** 3 created (coproperty_user, invoice_user, keycloak_user) ✅  
**Backups:** 2 backups present ✅

### Step 3.2: Configure database access (⚠️ verify this)

Make sure your **Kubernetes cluster node IPs** are whitelisted:

```bash
export KUBECONFIG=/Volumes/NidhalSSD/Projects/myb/ovhcloud/kubeconfig-ebak4v.yml
kubectl get nodes -o wide
# Copy the EXTERNAL-IP values and add them to:
# OVHcloud → Databases → myb-instance-db → Authorized IPs
```

---

## Phase 4: Set Up Container Registry ✅ DONE

**Registry name:** `myb-registry`  
**ID:** `ea84def0-51e6-49a3-8be6-e570c23236c4`  
**Region:** GRA  
**Plan:** S (200 GiB)  
**Harbor version:** 2.14.2  
**Status:** OK ✅  
**Registry URL:** `93pf2bi9.gra7.container-registry.ovh.net`  
**Login:** `QlAbsYCWXn`  
**Password:** already configured in `ovhcloud/k8s/secrets/registry-secret.yaml` ✅

### Step 4.3: Test registry login

```bash
docker login 93pf2bi9.gra7.container-registry.ovh.net
# Username: QlAbsYCWXn
# Password: 75924y8KlbY30G16
```

---

## Phase 5: Configure DNS & SSL (Optional for now, required for production)

### Step 5.1: Get Ingress IP (after deployment)

After deploying to Kubernetes, get the ingress load-balancer IP:

```bash
kubectl get ingress myb-ingress -n myb-platform
# Note the EXTERNAL-IP column
```

### Step 5.2: Configure DNS (if you have a domain)

1. **In OVHcloud Manager** → **"Domain names"** or your domain registrar
2. Create an **A record**:
   - **Subdomain**: `myb` (or `admin`, `api`, etc.)
   - **Type**: `A`
   - **Target**: `<INGRESS_EXTERNAL_IP>`
   - **TTL**: 300–3600
3. Wait 5–30 minutes for DNS propagation

### Step 5.3: Enable SSL/TLS (Let's Encrypt)

See `ovhcloud/docs/SSL_SETUP.md` in your repository after deployment.

---

## Phase 6: Update MYB Deployment Files

Once you have all credentials, update these files:

### 6.1: Database Secrets

Edit `ovhcloud/k8s/secrets/database-secrets.yaml`:

```yaml
stringData:
  # Fill in your actual values:
  COPROPERTY_DB_HOST: "postgresql-xxxxx.database.cloud.ovh.net"
  COPROPERTY_DB_PORT: "20184"
  COPROPERTY_DB_NAME: "copropertyDB"
  COPROPERTY_DB_USER: "coproperty_user"
  COPROPERTY_DB_PASSWORD: "STRONG_PASS_1"
  COPROPERTY_DB_CONNECTION_STRING: "Host=postgresql-xxxxx.database.cloud.ovh.net;Port=20184;Database=copropertyDB;Username=coproperty_user;Password=STRONG_PASS_1;SSL Mode=Require"
  
  # Repeat for invoice and keycloak...
```

### 6.2: Keycloak Secrets

Edit `ovhcloud/k8s/secrets/keycloak-secrets.yaml`:

```yaml
stringData:
  KEYCLOAK_ADMIN_USER: "admin"
  KEYCLOAK_ADMIN_PASSWORD: "$(openssl rand -base64 32)"  # Generate strong password
  KEYCLOAK_CLIENT_SECRET: "$(openssl rand -base64 32)"
  KEYCLOAK_SERVICE_CLIENT_SECRET: "$(openssl rand -base64 32)"
```

Generate passwords:
```bash
openssl rand -base64 32  # Run 3 times
```

### 6.3: SMTP Secrets

Edit `ovhcloud/k8s/secrets/smtp-secrets.yaml`:

```yaml
stringData:
  SMTP_HOST: "smtp.sendgrid.net"  # Or your SMTP provider
  SMTP_PORT: "587"
  SMTP_USERNAME: "apikey"
  SMTP_PASSWORD: "<YOUR_SENDGRID_API_KEY>"  # Get from SendGrid, Mailgun, etc.
  EMAIL_FROM_ADDRESS: "noreply@yourdomain.com"
  EMAIL_FROM_NAME: "MYB Platform"
```

### 6.4: Build script registry

Already configured — `ovhcloud/scripts/build-images.sh` uses:

```bash
REGISTRY="93pf2bi9.gra7.container-registry.ovh.net/myb"
```

### 6.5: Nx Frontend Apps (Admin & Client)

Both Angular/Nx apps have an `ovhcloud` build configuration that points all API URLs to the ingress domain automatically.

**Admin panel** (`apps/admin`) — built via `ovhcloud/docker/admin/Dockerfile`:
- Build config: `nx build admin --configuration=ovhcloud`
- Environment file used: `apps/admin/src/environments/environment.ovhcloud.ts`
- Served at: `https://yourdomain.com/admin`

**Client portal** (`apps/client`) — built via `ovhcloud/docker/client/Dockerfile`:
- Build config: `nx build client --configuration=ovhcloud`
- Environment file used: `apps/client/src/environments/environment.ovhcloud.ts`
- Served at: `https://yourdomain.com/`

No manual changes needed — service URLs in both environment files resolve relative to `window.location.origin` through the ingress.

> ⚠️ If your domain changes, **only update** `ovhcloud/k8s/ingress/ingress.yaml` (`host:` field). The Angular environments use `window.location.origin` so they adapt automatically.

---

## Phase 7: Deploy

Once all configuration is complete:

```bash
# 1. Ensure kubeconfig is set
export KUBECONFIG=~/.kube/config-myb-staging

# 2. Build and push all Docker images
#    Builds: coproperty, invoice, mailer, admin (Nx), client (Nx)
./ovhcloud/scripts/build-images.sh

# 3. Deploy everything to Kubernetes
#    Deploys in order: namespace → secrets → configmaps → rabbitmq
#    → keycloak → coproperty → invoice → mailer → myb-admin → myb-client → ingress
./ovhcloud/scripts/deploy.sh

# 4. Monitor all pods
kubectl get pods -n myb-platform -w

# 5. Get access URLs
kubectl get ingress -n myb-platform
```

**Services deployed:**

| Service | Type | URL path |
|---------|------|----------|
| myb-client | Frontend (Nx/Angular - Owner Portal) | `/` |
| myb-admin | Frontend (Nx/Angular - Syndic Panel) | `/admin` |
| keycloak | Auth | `/auth` |
| myb-coproperty | Backend API | `/api/coproperty` |
| myb-invoice | Backend API | `/api/invoice` |
| myb-mailer | Backend (internal) | — |
| rabbitmq | Message broker (internal) | — |

---

## Quick Reference: OVHcloud Manager Navigation

| Task | Path |
|------|------|
| **View Projects** | Public Cloud → Projects |
| **Kubernetes** | Public Cloud → [Project] → Kubernetes |
| **Databases** | Public Cloud → [Project] → Databases |
| **Container Registry** | Public Cloud → [Project] → Container Registry |
| **DNS/Domains** | Domain names → [Your domain] |
| **Billing** | My account → Billing |
| **SSH Keys** | Public Cloud → [Project] → SSH Keys |

---

## Cost Tracking

Monitor your spending:

1. **Top-right menu** → **"My bills"** or **"Billing"**
2. Set up **billing alerts** to avoid surprises
3. Check usage under **Public Cloud** → [Project] → **"Usage"**

**Estimated monthly costs:**
- **Kubernetes (staging)**: ~€175/month (3× b2-7 nodes)
- **PostgreSQL (Essential)**: ~€50/month
- **Container Registry**: ~€10/month
- **Total staging**: ~€235/month

---

## ✅ Completion Checklist

- [x] Public Cloud project created (`MYB`)
- [x] Kubernetes cluster deployed — `myb-coproperty-k8s` (SBG5, v1.35.2-1, OK)
- [x] kubeconfig downloaded — `ovhcloud/kubeconfig-ebak4v.yml`
- [x] Managed PostgreSQL instance provisioned — `myb-instance-db` (Frankfurt, Available)
- [x] 3 databases created (copropertyDB, invoiceDB, keycloak)
- [x] 3 database users created (coproperty_user, invoice_user, keycloak_user)
- [x] Container registry created — `myb-registry` (GRA, Harbor 2.14.2, OK)
- [x] Registry credentials configured in `ovhcloud/k8s/secrets/registry-secret.yaml`
- [x] Database secrets set in `ovhcloud/k8s/secrets/database-secrets.yaml`
- [x] Nx admin environment (`environment.ovhcloud.ts`) created
- [x] Nx client environment (`environment.ovhcloud.ts`) created
- [ ] ⚠️ Cluster node IPs whitelisted in `myb-instance-db` → Authorized IPs
- [ ] ⚠️ Keycloak secrets set (`KEYCLOAK_ADMIN_PASSWORD`, `KEYCLOAK_CLIENT_SECRET`)
- [ ] ⚠️ Invoice DB credentials set (user/password not yet provided)
- [ ] ⚠️ SMTP credentials set
- [ ] ⚠️ Domain name set in `ovhcloud/k8s/ingress/ingress.yaml` (`host:` field)
- [ ] Run `./ovhcloud/scripts/build-images.sh` (builds 5 images: coproperty, invoice, mailer, admin, client)
- [ ] Run `./ovhcloud/scripts/deploy.sh` (deploys 7 services)

---

**Next**: Follow each phase in order and come back once you have all credentials ready. Then we'll update the deployment files and deploy! 🚀
