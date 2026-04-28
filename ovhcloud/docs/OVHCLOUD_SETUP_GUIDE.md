# OVHcloud Setup Checklist for MYB Deployment

Account: **haithem khalifa** (haithem.khalifa@forlink-group.com)

---

## Phase 1: Create Public Cloud Project

### Step 1.1: Create a new Public Cloud project

1. **In OVHcloud Manager**, click **"Public Cloud"** (left sidebar)
2. Click **"Create project"** or **"Add a project"**
3. Fill in:
   - **Project name**: `myb-platform-staging` (or `myb-prod`)
   - **Region preference**: Choose closest to users
     - **GRA7** (Gravelines, France) - Western Europe
     - **SBG5** (Strasbourg, France) - Central Europe
     - **DE1** (Frankfurt, Germany) - Central Europe
   - Click **"Create"**
4. **Wait 1–2 minutes** for project creation
5. **Note the Project ID** (shown in the interface, e.g., `abcd1234efgh5678`)

### Step 1.2: Enable billing

1. Inside your new project → **"Billing"** or **"Payment"**
2. Ensure you have a **payment method** set (credit card or bank account)
3. If not, add one via **"My payment methods"** in the top-right menu

---

## Phase 2: Create Managed Kubernetes Cluster

### Step 2.1: Create Kubernetes cluster

1. In your Public Cloud project → **"Kubernetes"** (left menu)
2. Click **"Create a cluster"**
3. Configure:
   - **Cluster name**: `myb-staging-k8s` (or similar)
   - **Kubernetes version**: Choose latest stable (1.28+ recommended)
   - **Region**: Same as project (GRA7 or SBG5)
   - **Node pool name**: `worker-nodes`
   - **Node flavor**: 
     - **Staging**: `b2-7` (2 vCPU, 7GB RAM) × 3 nodes
     - **Production**: `b2-15` (4 vCPU, 15GB RAM) × 3 nodes
   - **Number of nodes**: `3`
   - **Auto-scaling**: Enable if desired (optional)
   - **SSH key** (optional): Upload your public key if you want SSH access to nodes
4. Click **"Create"**
5. **Wait 5–15 minutes** for cluster provisioning
   - Status will show "pending" → "ready"

### Step 2.2: Download kubeconfig

1. Cluster page → **"kubeconfig"** tab
2. Click **"Download kubeconfig"**
3. A `.kubeconfig` file will be downloaded
4. **Save it securely**:
   ```bash
   # macOS/Linux
   mkdir -p ~/.kube
   cp ~/Downloads/kubeconfig ~/.kube/config-myb-staging
   export KUBECONFIG=~/.kube/config-myb-staging
   
   # Verify connection
   kubectl cluster-info
   kubectl get nodes
   ```

---

## Phase 3: Create Managed PostgreSQL Database

### Step 3.1: Create PostgreSQL instance

1. In your Public Cloud project → **"Databases"** (left menu)
2. Click **"Create a database"**
3. Configure:
   - **Engine**: PostgreSQL 16
   - **Plan**:
     - **Staging**: Essential (Single node, sufficient for dev)
     - **Production**: Business (HA, automated backups)
   - **Region**: Same as Kubernetes cluster
   - **Node specifications** (Essential):
     - 2 vCores, 4GB RAM, 80GB SSD
   - **Backups**: Enable daily backups (automatic with Business plan)
   - **Network**: Use private network or public (if within OVH infrastructure)
4. Click **"Create"**
5. **Wait 5–10 minutes** for provisioning
6. **Note these credentials** (shown after creation):
   - **Hostname**: `postgresql-xxxxx.database.cloud.ovh.net`
   - **Port**: Usually `20184` (non-standard for security)
   - **Admin username**: `avnadmin`
   - **Admin password**: (generated, save securely)

### Step 3.2: Configure database access

1. Database instance page → **"Authorized IPs"** tab
2. Click **"Add authorized IP"**
3. Add your **Kubernetes cluster node public IPs**:
   ```bash
   # Get node IPs from your cluster
   kubectl get nodes -o wide
   # Copy the EXTERNAL-IP column (or use the cluster's public subnet CIDR)
   ```
4. Add in CIDR format, e.g., `203.0.113.0/24` or individual IPs

### Step 3.3: Create databases and users

Use `psql` client to connect and create application databases:

```bash
# Install psql if needed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Connect to admin database
psql "postgresql://avnadmin:YOUR_ADMIN_PASSWORD@postgresql-xxxxx.database.cloud.ovh.net:20184/defaultdb?sslmode=require"

# Inside psql, run these commands:
CREATE DATABASE "copropertyDB";
CREATE DATABASE "invoiceDB";
CREATE DATABASE "keycloak";

CREATE USER coproperty_user WITH ENCRYPTED PASSWORD 'STRONG_PASS_1';
CREATE USER invoice_user WITH ENCRYPTED PASSWORD 'STRONG_PASS_2';
CREATE USER keycloak_user WITH ENCRYPTED PASSWORD 'STRONG_PASS_3';

GRANT ALL PRIVILEGES ON DATABASE "copropertyDB" TO coproperty_user;
GRANT ALL PRIVILEGES ON DATABASE "invoiceDB" TO invoice_user;
GRANT ALL PRIVILEGES ON DATABASE "keycloak" TO keycloak_user;

# Verify
\list
\du
\q
```

**Save these credentials securely:**
```
COPROPERTY_DB_USER: coproperty_user
COPROPERTY_DB_PASSWORD: STRONG_PASS_1
COPROPERTY_DB_HOST: postgresql-xxxxx.database.cloud.ovh.net
COPROPERTY_DB_PORT: 20184
COPROPERTY_DB_NAME: copropertyDB

# ... repeat for invoice and keycloak
```

---

## Phase 4: Set Up Container Registry

### Step 4.1: Create container registry

1. In your Public Cloud project → **"Container Registry"** (left menu)
2. Click **"Create a registry"**
3. Configure:
   - **Name**: `myb-registry`
   - **Region**: Same as cluster
   - **Visibility**: Private (for security)
4. Click **"Create"**
5. **Note the registry URL**: `registry.gra7.container-registry.ovh.net/your-namespace`

### Step 4.2: Create registry credentials

1. Registry page → **"Users"** tab
2. Click **"Create a user"**
3. Configure:
   - **Username**: `myb-deployer`
   - **Password**: Generate strong password
4. Click **"Create"**
5. **Save credentials**:
   ```
   REGISTRY_URL: registry.gra7.container-registry.ovh.net/your-namespace
   REGISTRY_USERNAME: myb-deployer
   REGISTRY_PASSWORD: <generated_password>
   ```

### Step 4.3: Test registry login

```bash
docker login registry.gra7.container-registry.ovh.net
# Username: myb-deployer
# Password: <your_password>

# Test push
docker pull hello-world
docker tag hello-world registry.gra7.container-registry.ovh.net/your-namespace/hello-world:test
docker push registry.gra7.container-registry.ovh.net/your-namespace/hello-world:test
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

Edit `ovhcloud/scripts/build-images.sh` (line ~8):

```bash
REGISTRY="registry.gra7.container-registry.ovh.net/your-namespace/myb"
```

---

## Phase 7: Deploy

Once all configuration is complete:

```bash
# 1. Ensure kubeconfig is set
export KUBECONFIG=~/.kube/config-myb-staging

# 2. Build and push Docker images
./ovhcloud/scripts/build-images.sh

# 3. Deploy to Kubernetes
./ovhcloud/scripts/deploy.sh

# 4. Monitor
kubectl get pods -n myb-platform -w

# 5. Get access URLs
kubectl get ingress -n myb-platform
```

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

After completing all phases:

- [ ] Public Cloud project created
- [ ] Kubernetes cluster deployed and kubeconfig downloaded
- [ ] Managed PostgreSQL instance provisioned
- [ ] 3 databases created (copropertyDB, invoiceDB, keycloak)
- [ ] 3 database users created with passwords
- [ ] Cluster nodes IP-whitelisted in database
- [ ] Container registry created
- [ ] Registry credentials saved
- [ ] All `ovhcloud/k8s/secrets/*.yaml` files updated
- [ ] Build script registry URL updated
- [ ] Ready to run `./ovhcloud/scripts/build-images.sh`
- [ ] Ready to run `./ovhcloud/scripts/deploy.sh`

---

**Next**: Follow each phase in order and come back once you have all credentials ready. Then we'll update the deployment files and deploy! 🚀
