# MYB Platform - OVHCloud Kubernetes Deployment Guide

Complete guide for deploying MYB Platform (Coproperty Management, Invoice, Mailer, and Admin) to OVHCloud Managed Kubernetes.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Detailed Deployment Steps](#detailed-deployment-steps)
- [Configuration](#configuration)
- [Monitoring & Operations](#monitoring--operations)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)

## Overview

This deployment configuration deploys the following services to OVHCloud:

**Backend Services:**
- `myb-coproperty` - Coproperty management service (ASP.NET Core)
- `myb-invoice` - Invoice management service (ASP.NET Core)
- `myb-mailer` - Email service with RabbitMQ integration (ASP.NET Core)

**Frontend:**
- `myb-admin` - Admin dashboard (Angular/Nx)

**Infrastructure:**
- `keycloak` - Identity and access management
- `rabbitmq` - Message broker for async communication
- PostgreSQL databases (OVHCloud Managed Database)

## Prerequisites

### OVHcloud Account Setup

**New to OVHcloud?** Follow the complete setup guide first:
→ **[OVHCLOUD_SETUP_GUIDE.md](./docs/OVHCLOUD_SETUP_GUIDE.md)** ← Start here!

This covers:
- Creating a Public Cloud project
- Setting up Kubernetes cluster
- Creating Managed PostgreSQL
- Configuring container registry
- Downloading kubeconfig
- Creating database users & whitelisting

### Required Tools

1. **kubectl** (v1.28+)
   ```bash
   # macOS
   brew install kubectl
   
   # Ubuntu/Debian
   sudo apt-get install kubectl
   ```

2. **Docker** (v24+)
   ```bash
   # macOS
   brew install --cask docker
   
   # Ubuntu
   sudo apt-get install docker.io
   ```

3. **OVHCloud CLI** (optional but recommended)
   ```bash
   # Install ovhai
   curl -sSL https://cli.bhs.ai.cloud.ovh.net/install.sh | bash
   ```

4. **Node.js** (v18+) - for building frontend
   ```bash
   brew install node  # macOS
   ```

### OVHCloud Requirements

1. **OVHCloud Account** with Public Cloud project
2. **Managed Kubernetes Cluster**
   - Minimum: 3 nodes, 4GB RAM each
   - Recommended: 3 nodes, 8GB RAM each
   - Region: GRA7, SBG5, or closest to your users

3. **Managed PostgreSQL Database**
   - See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for details
   - Essential plan for staging, Business for production

4. **Container Registry** (optional but recommended)
   - OVHCloud Harbor Registry OR
   - Docker Hub OR
   - GitHub Container Registry

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OVHCloud Kubernetes                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │               Ingress (NGINX)                    │   │
│  │    /admin → Admin Frontend                       │   │
│  │    /auth → Keycloak                              │   │
│  │    /api/coproperty → Coproperty Service          │   │
│  │    /api/invoice → Invoice Service                │   │
│  └─────────────────────────────────────────────────┘   │
│                           │                              │
│  ┌────────────┬──────────┴──────────┬───────────────┐  │
│  │  Admin     │  Keycloak           │  RabbitMQ     │  │
│  │  (2 pods)  │  (1 pod)            │  (1 pod)      │  │
│  └────────────┴─────────────────────┴───────────────┘  │
│                           │                              │
│  ┌────────────┬──────────┴──────────┬───────────────┐  │
│  │Coproperty  │  Invoice            │  Mailer       │  │
│  │(2 pods)    │  (2 pods)           │  (2 pods)     │  │
│  └────────────┴─────────────────────┴───────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │  OVHCloud Managed PostgreSQL    │
         │  - copropertyDB                 │
         │  - invoiceDB                    │
         │  - keycloak                     │
         └─────────────────────────────────┘
```

## Quick Start

### 1. Clone and Configure

```bash
cd /path/to/myb
```

### 2. Set Up Kubernetes Cluster

Create a Kubernetes cluster in OVHCloud:

1. Go to [OVHCloud Control Panel](https://www.ovh.com/manager/)
2. Navigate to **Public Cloud** → **Kubernetes**
3. Click **Create a cluster**
4. Configure:
   - **Name**: `myb-k8s-staging`
   - **Version**: Latest stable (1.28+)
   - **Region**: GRA7 or SBG5
   - **Node pool**: 3 nodes, b2-7 (2 vCPU, 7GB RAM) or higher
5. Wait for cluster creation (5-10 minutes)

### 3. Download Kubeconfig

```bash
# Using OVHCloud Control Panel
# Go to Kubernetes → Your Cluster → kubeconfig
# Download and save to ~/.kube/config

# OR using ovhai CLI
ovhai kubeconfig download <cluster-id>

# Verify connection
kubectl cluster-info
```

### 4. Set Up Databases

Follow the [DATABASE_SETUP.md](./DATABASE_SETUP.md) guide to:
1. Create OVHCloud Managed PostgreSQL instance
2. Create databases: copropertyDB, invoiceDB, keycloak
3. Create database users with proper permissions
4. Configure IP allowlist

### 5. Update Configuration

**a) Update Database Secrets:**

Edit `ovhcloud/k8s/secrets/database-secrets.yaml`:

```yaml
stringData:
  COPROPERTY_DB_HOST: "postgresql-xxxxx.database.cloud.ovh.net"
  COPROPERTY_DB_PORT: "20184"
  COPROPERTY_DB_PASSWORD: "YOUR_ACTUAL_PASSWORD"
  # ... update all database credentials
```

**b) Update Keycloak Secrets:**

Edit `ovhcloud/k8s/secrets/keycloak-secrets.yaml`:

```yaml
stringData:
  KEYCLOAK_ADMIN_PASSWORD: "STRONG_PASSWORD_HERE"
  KEYCLOAK_CLIENT_SECRET: "GENERATED_SECRET_HERE"
  # ... update all secrets
```

**c) Update SMTP Configuration:**

Edit `ovhcloud/k8s/secrets/smtp-secrets.yaml`:

```yaml
stringData:
  SMTP_HOST: "smtp.sendgrid.net"
  SMTP_USERNAME: "apikey"
  SMTP_PASSWORD: "YOUR_SENDGRID_API_KEY"
  EMAIL_FROM_ADDRESS: "noreply@yourdomain.com"
```

### 6. Build and Push Docker Images

Configure your container registry:

```bash
# Example for Docker Hub
export DOCKER_REGISTRY="yourdockerhub/myb"

# Example for OVHCloud Harbor
export DOCKER_REGISTRY="registry.gra7.container-registry.ovh.net/your-project"

# Build and push all images
./ovhcloud/scripts/build-images.sh
```

This will:
- Build myb-coproperty, myb-invoice, myb-mailer
- Build myb-admin frontend
- Push all images to your registry
- Update Kubernetes manifests with registry URL

### 7. Deploy to Kubernetes

```bash
./ovhcloud/scripts/deploy.sh
```

This will:
1. Create namespace `myb-platform`
2. Apply secrets and configmaps
3. Deploy RabbitMQ
4. Deploy Keycloak
5. Deploy backend services (coproperty, invoice, mailer)
6. Deploy admin frontend
7. Configure ingress
8. Display access URLs

### 8. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n myb-platform

# Check services
kubectl get svc -n myb-platform

# Check ingress
kubectl get ingress -n myb-platform

# View logs
kubectl logs -f deployment/myb-coproperty -n myb-platform
```

## Detailed Deployment Steps

### Step 1: Namespace Creation

```bash
kubectl apply -f ovhcloud/k8s/namespaces/myb-namespace.yaml
```

### Step 2: Secrets Management

**Important:** Never commit real secrets to Git!

For production, use one of these:
- **Sealed Secrets**: Encrypt secrets before committing
- **External Secrets Operator**: Sync from OVHCloud Secrets Manager
- **Vault**: HashiCorp Vault integration

Development/Staging:
```bash
kubectl apply -f ovhcloud/k8s/secrets/
```

### Step 3: Infrastructure Services

Deploy in order:

1. **RabbitMQ** (message broker)
   ```bash
   kubectl apply -f ovhcloud/k8s/services/rabbitmq/deployment.yaml
   kubectl wait --for=condition=available deployment/rabbitmq -n myb-platform --timeout=180s
   ```

2. **Keycloak** (identity provider)
   ```bash
   kubectl apply -f ovhcloud/k8s/services/keycloak/deployment.yaml
   kubectl wait --for=condition=available deployment/keycloak -n myb-platform --timeout=300s
   ```

### Step 4: Application Services

Deploy backend services:

```bash
kubectl apply -f ovhcloud/k8s/services/coproperty/deployment.yaml
kubectl apply -f ovhcloud/k8s/services/invoice/deployment.yaml
kubectl apply -f ovhcloud/k8s/services/mailer/deployment.yaml
```

### Step 5: Frontend

```bash
kubectl apply -f ovhcloud/k8s/services/admin/deployment.yaml
```

### Step 6: Ingress

```bash
kubectl apply -f ovhcloud/k8s/ingress/ingress.yaml
```

Get external IP:
```bash
kubectl get ingress myb-ingress -n myb-platform
```

## Configuration

### Environment Variables

**Backend Services (ASP.NET Core):**
- `ASPNETCORE_ENVIRONMENT`: `Staging` or `Production`
- `ConnectionStrings__*DBConnection`: Database connection strings
- `Keycloak__*`: Keycloak configuration
- `RabbitMq__Host`: RabbitMQ hostname

**Frontend (Angular):**
- `NODE_ENV`: `production`

### Scaling

Scale deployments:
```bash
# Scale coproperty service to 3 replicas
kubectl scale deployment myb-coproperty --replicas=3 -n myb-platform

# Enable autoscaling
kubectl autoscale deployment myb-coproperty \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n myb-platform
```

### Resource Limits

Current configurations:

**Backend Services:**
- Requests: 250m CPU, 512Mi memory
- Limits: 500m CPU, 1Gi memory

**Frontend:**
- Requests: 100m CPU, 256Mi memory
- Limits: 250m CPU, 512Mi memory

**Infrastructure:**
- Keycloak: 500m-1000m CPU, 1-2Gi memory
- RabbitMQ: 250m-500m CPU, 512Mi-1Gi memory

## Monitoring & Operations

### Viewing Logs

```bash
# All pods in namespace
kubectl logs -f -l app=myb-coproperty -n myb-platform

# Specific deployment
kubectl logs -f deployment/myb-invoice -n myb-platform

# Previous crashed pod
kubectl logs --previous <pod-name> -n myb-platform
```

### Health Checks

All services have health endpoints:
```bash
# Port-forward to service
kubectl port-forward svc/myb-coproperty 8088:8088 -n myb-platform

# Test health endpoint
curl http://localhost:8088/health
```

### Debugging

```bash
# Describe pod for events
kubectl describe pod <pod-name> -n myb-platform

# Shell into pod
kubectl exec -it <pod-name> -n myb-platform -- /bin/sh

# View all events
kubectl get events -n myb-platform --sort-by='.lastTimestamp'
```

### Database Migrations

Run migrations manually:
```bash
# Port-forward to database (if needed)
kubectl port-forward svc/postgres 5432:5432

# Or exec into a service pod
kubectl exec -it deployment/myb-coproperty -n myb-platform -- dotnet ef database update
```

### Rolling Updates

```bash
# Update image
kubectl set image deployment/myb-coproperty \
  coproperty=your-registry/myb-coproperty:v2.0 \
  -n myb-platform

# Check rollout status
kubectl rollout status deployment/myb-coproperty -n myb-platform

# Rollback if needed
kubectl rollout undo deployment/myb-coproperty -n myb-platform
```

### Backup & Restore

**Database Backups:** Managed automatically by OVHCloud (see DATABASE_SETUP.md)

**Kubernetes Resources:**
```bash
# Backup all resources
kubectl get all -n myb-platform -o yaml > myb-platform-backup.yaml

# Restore
kubectl apply -f myb-platform-backup.yaml
```

## Troubleshooting

### Common Issues

**1. Pods stuck in Pending**
```bash
kubectl describe pod <pod-name> -n myb-platform
```
Common causes:
- Insufficient resources
- PVC not binding (check storage class)
- Image pull errors

**2. Database Connection Errors**
- Check secrets are correct
- Verify database IP is whitelisted
- Ensure SSL mode is enabled
- Test connection from pod:
  ```bash
  kubectl run psql-test --image=postgres:16 -n myb-platform -it --rm -- \
    psql "postgresql://user:pass@host:port/db?sslmode=require"
  ```

**3. Keycloak Not Starting**
- Check database connection
- Increase resources (memory)
- View logs for specific errors

**4. 502 Bad Gateway**
- Backend service not ready
- Check pod health:
  ```bash
  kubectl get pods -n myb-platform
  kubectl logs <pod-name> -n myb-platform
  ```

**5. Image Pull Errors**
- Verify registry credentials
- Create image pull secret:
  ```bash
  kubectl create secret docker-registry regcred \
    --docker-server=<registry> \
    --docker-username=<username> \
    --docker-password=<password> \
    -n myb-platform
  ```

### Getting Help

```bash
# View all resources
kubectl get all -n myb-platform

# Check ingress
kubectl describe ingress myb-ingress -n myb-platform

# View secrets (names only)
kubectl get secrets -n myb-platform

# Check persistent volumes
kubectl get pvc -n myb-platform
```

## Cost Estimation

### OVHCloud Kubernetes
- **Node Pool** (3x b2-7): ~€0.08/hour × 3 = €0.24/hour
- **Monthly**: ~€175/month
- **Control Plane**: Free

### Managed Database (Staging)
- **Essential Plan** (1 instance, 3 databases): ~€50/month

### Container Registry
- **Harbor Essential**: ~€10/month (100GB storage)

### Load Balancer
- **Included** with Kubernetes

### Total Estimated Cost (Staging)
- **~€235/month**

### Production Recommendations
- Upgrade nodes to b2-15 (4 vCPU, 15GB): ~€450/month
- Managed Database Business plan: ~€200/month
- Add monitoring/backup: ~€50/month
- **Total Production: ~€700/month**

## Security Best Practices

1. ✅ **Use strong passwords** - Generate with `openssl rand -base64 32`
2. ✅ **Enable Network Policies** - Restrict pod-to-pod communication
3. ✅ **Use RBAC** - Limit service account permissions
4. ✅ **Enable Pod Security Standards** - Enforce security policies
5. ✅ **Scan images** - Use Trivy or similar tools
6. ✅ **Rotate secrets regularly** - Every 90 days
7. ✅ **Enable audit logging** - Track all API access
8. ✅ **Use SSL/TLS** - Configure cert-manager for HTTPS

## Next Steps

After successful deployment:

1. **Configure Domain & SSL**
   - Point DNS to ingress IP
   - Install cert-manager
   - Configure Let's Encrypt

2. **Set Up Keycloak**
   - Create realm
   - Configure clients
   - Set up user federation

3. **Run Database Migrations**
   - Execute EF Core migrations
   - Seed initial data

4. **Configure Monitoring**
   - Install Prometheus & Grafana
   - Set up alerts

5. **Set Up CI/CD**
   - GitHub Actions or GitLab CI
   - Automate builds and deployments

## Support & Resources

- **OVHCloud Docs**: https://docs.ovh.com/
- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Project Issues**: Report bugs in the repository

## Cleanup

To completely remove the deployment:

```bash
./ovhcloud/scripts/cleanup.sh
```

**Warning:** This will delete all resources and cannot be undone!

---

**Last Updated**: April 2026
**Version**: 1.0.0
