# OVHCloud Deployment - Summary & Next Steps

## ✅ What Has Been Created

Your OVHCloud deployment configuration is ready! Here's what was created:

### 📁 Directory Structure

```
ovhcloud/
├── README.md                          # Main deployment guide
├── QUICK_REFERENCE.md                 # Quick commands cheat sheet
├── docs/
│   ├── DATABASE_SETUP.md              # PostgreSQL setup guide
│   └── SSL_SETUP.md                   # HTTPS/TLS configuration
├── k8s/
│   ├── namespaces/
│   │   └── myb-namespace.yaml         # Namespace definition
│   ├── secrets/
│   │   ├── database-secrets.yaml      # Database credentials (UPDATE!)
│   │   ├── keycloak-secrets.yaml      # Keycloak secrets (UPDATE!)
│   │   └── smtp-secrets.yaml          # SMTP configuration (UPDATE!)
│   ├── config/
│   │   └── app-config.yaml            # Application configuration
│   ├── services/
│   │   ├── rabbitmq/
│   │   │   └── deployment.yaml        # RabbitMQ message broker
│   │   ├── keycloak/
│   │   │   └── deployment.yaml        # Keycloak identity provider
│   │   ├── coproperty/
│   │   │   └── deployment.yaml        # Coproperty service
│   │   ├── invoice/
│   │   │   └── deployment.yaml        # Invoice service
│   │   ├── mailer/
│   │   │   └── deployment.yaml        # Mailer service
│   │   └── admin/
│   │       └── deployment.yaml        # Admin frontend
│   ├── ingress/
│   │   └── ingress.yaml               # NGINX ingress (HTTP routing)
│   └── autoscaling/
│       └── hpa.yaml                   # Horizontal Pod Autoscaler
├── docker/
│   └── admin/
│       ├── Dockerfile                 # Admin frontend Docker image
│       └── nginx.conf                 # NGINX configuration
└── scripts/
    ├── build-images.sh                # Build & push Docker images
    ├── deploy.sh                      # Deploy to Kubernetes
    └── cleanup.sh                     # Remove all resources
```

### 🐳 Docker Images Configuration

Dockerfiles created for:
- ✅ **myb-coproperty** (uses existing Dockerfile)
- ✅ **myb-invoice** (uses existing Dockerfile)
- ✅ **myb-mailer** (uses existing Dockerfile)
- ✅ **myb-admin** (new multi-stage Dockerfile)

### ☸️ Kubernetes Resources

- **Namespace**: `myb-platform`
- **Deployments**: 6 services with health checks, resource limits
- **Services**: ClusterIP services for internal communication
- **Ingress**: HTTP routing with paths:
  - `/admin` → Admin frontend
  - `/auth` → Keycloak
  - `/api/coproperty` → Coproperty API
  - `/api/invoice` → Invoice API
- **Secrets**: 3 secret files (database, Keycloak, SMTP)
- **ConfigMaps**: Application configuration
- **PVCs**: Persistent storage for RabbitMQ and Keycloak
- **HPA**: Auto-scaling based on CPU/memory

### 📚 Documentation

- ✅ Comprehensive deployment guide (README.md)
- ✅ Database setup instructions
- ✅ SSL/TLS configuration guide
- ✅ Quick reference commands
- ✅ CI/CD pipeline example (GitHub Actions)

## 🚀 Deployment Checklist

Before deploying, complete these steps:

### 1. OVHCloud Setup

- [ ] Create OVHCloud Public Cloud project
- [ ] Create Managed Kubernetes cluster
  - 3 nodes minimum
  - b2-7 or higher (2 vCPU, 7GB RAM)
  - Region: GRA7 or SBG5
- [ ] Download kubeconfig and configure kubectl
- [ ] Verify connection: `kubectl cluster-info`

### 2. Database Setup

- [ ] Create OVHCloud Managed PostgreSQL instance
- [ ] Create databases: `copropertyDB`, `invoiceDB`, `keycloak`
- [ ] Create database users with passwords
- [ ] Configure IP allowlist (Kubernetes node IPs)
- [ ] Save database credentials

### 3. Container Registry

- [ ] Set up container registry (OVHCloud Harbor, Docker Hub, or GitHub)
- [ ] Create registry credentials
- [ ] Update `DOCKER_REGISTRY` in `build-images.sh`

### 4. SMTP Configuration

- [ ] Set up SMTP provider (SendGrid, Mailgun, etc.)
- [ ] Get SMTP credentials and API key
- [ ] Configure sender email address

### 5. Update Configuration Files

**Critical: Update these files with your actual values!**

**a) Database Secrets** (`ovhcloud/k8s/secrets/database-secrets.yaml`):
```bash
# Replace ALL placeholder values:
- COPROPERTY_DB_HOST
- COPROPERTY_DB_PASSWORD
- INVOICE_DB_PASSWORD
- KEYCLOAK_DB_PASSWORD
- Connection strings
```

**b) Keycloak Secrets** (`ovhcloud/k8s/secrets/keycloak-secrets.yaml`):
```bash
# Generate strong passwords:
openssl rand -base64 32  # Run 3 times

# Replace:
- KEYCLOAK_ADMIN_PASSWORD
- KEYCLOAK_CLIENT_SECRET
- KEYCLOAK_SERVICE_CLIENT_SECRET
```

**c) SMTP Secrets** (`ovhcloud/k8s/secrets/smtp-secrets.yaml`):
```bash
# Replace:
- SMTP_HOST
- SMTP_PASSWORD (API key)
- EMAIL_FROM_ADDRESS
```

**d) Build Script** (`ovhcloud/scripts/build-images.sh`):
```bash
# Line 8: Update registry
REGISTRY="your-registry.com/myb"
```

**e) Ingress** (`ovhcloud/k8s/ingress/ingress.yaml`):
```bash
# Update domain (or use IP initially)
host: myb.forlink.com
```

### 6. Build and Deploy

```bash
# 1. Build and push images
export DOCKER_REGISTRY="your-registry.com/myb"
./ovhcloud/scripts/build-images.sh

# 2. Deploy to Kubernetes
./ovhcloud/scripts/deploy.sh

# 3. Monitor deployment
kubectl get pods -n myb-platform -w

# 4. Get ingress IP
kubectl get ingress myb-ingress -n myb-platform
```

### 7. Post-Deployment Configuration

- [ ] Configure DNS (point domain to ingress IP)
- [ ] Set up SSL/TLS with cert-manager (see docs/SSL_SETUP.md)
- [ ] Configure Keycloak:
  - Create realm "MYB"
  - Create clients
  - Configure user federation
- [ ] Run database migrations
- [ ] Test all services
- [ ] Set up monitoring (optional)

## 📖 Documentation Links

- **Main Guide**: [ovhcloud/README.md](./README.md)
- **Quick Reference**: [ovhcloud/QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Database Setup**: [ovhcloud/docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md)
- **SSL Setup**: [ovhcloud/docs/SSL_SETUP.md](./docs/SSL_SETUP.md)

## 🎯 Deployment Commands

### Quick Deploy (After Configuration)

```bash
# Full deployment
./ovhcloud/scripts/deploy.sh

# Build images only
./ovhcloud/scripts/build-images.sh

# Cleanup everything
./ovhcloud/scripts/cleanup.sh
```

### Individual Commands

```bash
# Apply namespace
kubectl apply -f ovhcloud/k8s/namespaces/

# Apply secrets (after updating!)
kubectl apply -f ovhcloud/k8s/secrets/

# Apply config
kubectl apply -f ovhcloud/k8s/config/

# Deploy services
kubectl apply -f ovhcloud/k8s/services/ -R

# Deploy ingress
kubectl apply -f ovhcloud/k8s/ingress/

# Enable autoscaling
kubectl apply -f ovhcloud/k8s/autoscaling/
```

## 🔍 Verification

After deployment, verify:

```bash
# Check all pods are running
kubectl get pods -n myb-platform

# Check services
kubectl get svc -n myb-platform

# Check ingress and get IP
kubectl get ingress -n myb-platform

# View logs
kubectl logs -f deployment/myb-coproperty -n myb-platform

# Test health endpoints
kubectl port-forward svc/myb-coproperty 8088:8088 -n myb-platform
curl http://localhost:8088/health
```

## 💰 Cost Estimate

**Staging Environment:**
- Kubernetes (3x b2-7 nodes): ~€175/month
- Managed PostgreSQL (Essential): ~€50/month
- Container Registry: ~€10/month
- **Total: ~€235/month**

**Production Environment:**
- Kubernetes (3x b2-15 nodes): ~€450/month
- Managed PostgreSQL (Business): ~€200/month
- Container Registry: ~€20/month
- Monitoring/Backup: ~€50/month
- **Total: ~€720/month**

## 🆘 Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n myb-platform
kubectl logs <pod-name> -n myb-platform
```

### Database Connection Issues

```bash
# Test from pod
kubectl run psql-test --image=postgres:16 -n myb-platform -it --rm -- \
  psql "postgresql://user:pass@host:port/db?sslmode=require"
```

### Image Pull Errors

```bash
# Create registry secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<pass> \
  -n myb-platform
```

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for more troubleshooting commands.

## 🎉 Next Steps After Deployment

1. **Set up monitoring**
   - Install Prometheus & Grafana
   - Configure alerts

2. **Configure CI/CD**
   - Set up GitHub Actions (template provided)
   - Configure auto-deployment

3. **Security hardening**
   - Enable Network Policies
   - Set up Pod Security Standards
   - Rotate secrets

4. **Performance optimization**
   - Enable HPA (autoscaling)
   - Configure resource requests/limits
   - Set up caching

5. **Backup & DR**
   - Configure automated backups
   - Test disaster recovery procedures
   - Document runbooks

## 📞 Support

- **OVHCloud Support**: https://help.ovhcloud.com/
- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Project Issues**: Your repository

## 🔗 Useful Resources

- [OVHCloud Kubernetes Guide](https://docs.ovh.com/gb/en/kubernetes/)
- [OVHCloud Databases](https://docs.ovh.com/gb/en/publiccloud/databases/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## ⚠️ Important Reminders

1. **Never commit secrets to Git!**
   - Add `ovhcloud/k8s/secrets/*.yaml` to `.gitignore` after updating
   - Use environment-specific secret management

2. **Test in staging first**
   - Always test deployments in staging before production
   - Use staging Let's Encrypt issuer for SSL testing

3. **Backup regularly**
   - OVHCloud managed databases have automatic backups
   - Export Kubernetes resources periodically

4. **Monitor costs**
   - Check OVHCloud billing dashboard regularly
   - Set up billing alerts

5. **Security**
   - Use strong passwords (32+ characters)
   - Rotate secrets every 90 days
   - Keep Kubernetes and images updated

---

**Created**: April 2026  
**Version**: 1.0.0  
**Author**: MYB Platform Team

**Good luck with your deployment! 🚀**
