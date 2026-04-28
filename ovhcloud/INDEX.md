# OVHCloud Deployment Configuration

Complete Kubernetes deployment configuration for deploying MYB platform services to OVHCloud.
## 🎯 START HERE

👉 **New to OVHcloud?** → [START_HERE.md](./START_HERE.md)

This shows:
- Your roadmap from setup to deployment
- Timeline (30-45 minutes total)
- Where to find documentation
- Credentials tracker

---

## 📖 Documentation

### Quick Start (Print & Use)
- **[START_HERE.md](./START_HERE.md)** - Your deployment roadmap
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - OVHcloud setup checklist (printable)

### Detailed Guides
- **[README.md](./README.md)** - Complete deployment guide
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - What's included & next steps
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Command cheat sheet

### Configuration Guides
- **[docs/OVHCLOUD_SETUP_GUIDE.md](./docs/OVHCLOUD_SETUP_GUIDE.md)** - OVHcloud Manager step-by-step
- **[docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md)** - PostgreSQL setup & management
- **[docs/SSL_SETUP.md](./docs/SSL_SETUP.md)** - HTTPS/TLS configuration

### DevOps
- **[.github/workflows/deploy-ovhcloud.yml](../.github/workflows/deploy-ovhcloud.yml)** - GitHub Actions CI/CD

---
## 🚀 Quick Start

```bash
# 1. Configure kubectl
kubectl cluster-info

# 2. Update secrets in k8s/secrets/

# 3. Build images
export DOCKER_REGISTRY="your-registry.com/myb"
./scripts/build-images.sh

# 4. Deploy
./scripts/deploy.sh
```

## 📦 What Gets Deployed

- **myb-coproperty** - Coproperty management service
- **myb-invoice** - Invoice management service  
- **myb-mailer** - Email service
- **myb-admin** - Admin dashboard (Angular)
- **keycloak** - Identity provider
- **rabbitmq** - Message broker
- **PostgreSQL** - OVHCloud Managed Database (external)

## 📚 Documentation

- **[README.md](./README.md)** - Complete deployment guide
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - What's included & next steps
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Command cheat sheet
- **[docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md)** - PostgreSQL setup
- **[docs/SSL_SETUP.md](./docs/SSL_SETUP.md)** - HTTPS configuration

## ⚙️ Configuration Required

Before deploying, update these files:

1. `k8s/secrets/database-secrets.yaml` - Database credentials
2. `k8s/secrets/keycloak-secrets.yaml` - Keycloak passwords
3. `k8s/secrets/smtp-secrets.yaml` - SMTP configuration
4. `scripts/build-images.sh` - Docker registry URL

## 💰 Cost Estimate

- **Staging**: ~€235/month
- **Production**: ~€720/month

See [README.md](./README.md) for detailed breakdown.

## 🆘 Help

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for troubleshooting commands.

---

**Version**: 1.0.0 | **Last Updated**: April 2026
