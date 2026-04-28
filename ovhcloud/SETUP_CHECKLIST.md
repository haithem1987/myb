# OVHcloud Setup - Quick Checklist Card

Print this or pin to your screen while setting up!

## 🔧 Pre-Deployment Setup (Do This First)

### ✅ Phase 1: Public Cloud Project
- [ ] Go to OVHcloud Manager → Public Cloud
- [ ] Click "Create project"
- [ ] Name it: `myb-platform-staging`
- [ ] Choose region: GRA7 or SBG5
- [ ] **Save Project ID**

### ✅ Phase 2: Kubernetes Cluster
- [ ] Public Cloud → Kubernetes → Create cluster
- [ ] Name: `myb-staging-k8s`
- [ ] Version: 1.28+
- [ ] Nodes: 3 × b2-7 (staging) or 3 × b2-15 (prod)
- [ ] Region: Same as project
- [ ] Wait 5–15 minutes for "Ready" status
- [ ] Download kubeconfig
- [ ] Test: `kubectl cluster-info` ✓

**Save kubeconfig path:**
```
~/.kube/config-myb-staging
```

### ✅ Phase 3: PostgreSQL Database
- [ ] Public Cloud → Databases → Create database
- [ ] Engine: PostgreSQL 16
- [ ] Plan: Essential (staging) / Business (prod)
- [ ] Region: Same as cluster
- [ ] Wait 5–10 minutes
- [ ] Authorized IPs → Add cluster node IPs
- [ ] **Save:**
  - Hostname
  - Port (usually 20184)
  - Admin user/password

**Connect & create databases:**
```bash
psql "postgresql://avnadmin:PASS@HOST:20184/defaultdb?sslmode=require"

CREATE DATABASE "copropertyDB";
CREATE DATABASE "invoiceDB";
CREATE DATABASE "keycloak";

CREATE USER coproperty_user WITH PASSWORD 'PASS1';
CREATE USER invoice_user WITH PASSWORD 'PASS2';
CREATE USER keycloak_user WITH PASSWORD 'PASS3';

GRANT ALL PRIVILEGES ON DATABASE "copropertyDB" TO coproperty_user;
GRANT ALL PRIVILEGES ON DATABASE "invoiceDB" TO invoice_user;
GRANT ALL PRIVILEGES ON DATABASE "keycloak" TO keycloak_user;
```

**Save credentials:**
```
coproperty_user / PASS1
invoice_user / PASS2
keycloak_user / PASS3
```

### ✅ Phase 4: Container Registry
- [ ] Public Cloud → Container Registry → Create registry
- [ ] Name: `myb-registry`
- [ ] Visibility: Private
- [ ] Users tab → Create user
- [ ] Username: `myb-deployer`
- [ ] **Save credentials**

### ✅ Phase 5: Generate Secret Passwords
```bash
# Generate 3 strong passwords:
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32

# Get SendGrid/SMTP API key from your email provider
```

---

## 📝 Update Configuration Files

### File 1: `ovhcloud/k8s/secrets/database-secrets.yaml`
```yaml
COPROPERTY_DB_HOST: "postgresql-xxxxx.database.cloud.ovh.net"
COPROPERTY_DB_PORT: "20184"
COPROPERTY_DB_PASSWORD: "<PASS1>"
# ... update all database values
```

### File 2: `ovhcloud/k8s/secrets/keycloak-secrets.yaml`
```yaml
KEYCLOAK_ADMIN_PASSWORD: "<GENERATED_PASS>"
KEYCLOAK_CLIENT_SECRET: "<GENERATED_PASS>"
KEYCLOAK_SERVICE_CLIENT_SECRET: "<GENERATED_PASS>"
```

### File 3: `ovhcloud/k8s/secrets/smtp-secrets.yaml`
```yaml
SMTP_HOST: "smtp.sendgrid.net"
SMTP_PASSWORD: "<SENDGRID_API_KEY>"
EMAIL_FROM_ADDRESS: "noreply@yourdomain.com"
```

### File 4: `ovhcloud/scripts/build-images.sh` (line 8)
```bash
REGISTRY="registry.gra7.container-registry.ovh.net/your-namespace/myb"
```

---

## 🚀 Deploy

Once all files are updated:

```bash
# 1. Set kubeconfig
export KUBECONFIG=~/.kube/config-myb-staging

# 2. Build images
./ovhcloud/scripts/build-images.sh

# 3. Deploy
./ovhcloud/scripts/deploy.sh

# 4. Monitor
kubectl get pods -n myb-platform

# 5. Get ingress IP
kubectl get ingress -n myb-platform
```

---

## 💡 Keep Handy

**Kubernetes commands:**
```bash
kubectl cluster-info
kubectl get nodes
kubectl get pods -n myb-platform
kubectl logs -f deployment/myb-coproperty -n myb-platform
kubectl describe pod <pod-name> -n myb-platform
```

**Database connection:**
```bash
psql "postgresql://USER:PASS@HOST:PORT/DB?sslmode=require"
```

**Registry login:**
```bash
docker login registry.gra7.container-registry.ovh.net
```

---

**Estimated Time:** 30–45 minutes total
**Total Cost (Staging):** ~€235/month

**Questions?** See `ovhcloud/docs/OVHCLOUD_SETUP_GUIDE.md` for detailed steps.
