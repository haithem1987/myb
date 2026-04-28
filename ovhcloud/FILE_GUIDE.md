# Complete File Structure & Navigation Guide

Your OVHcloud deployment package is ready. Here's what we've created:

---

## 📁 Complete Directory Structure

```
ovhcloud/
├── 🎯 START_HERE.md                    ← Read this first!
├── SETUP_CHECKLIST.md                  ← Print & follow during setup
├── INDEX.md                            ← Documentation index
├── README.md                           ← Comprehensive guide
├── DEPLOYMENT_SUMMARY.md               ← What's included
├── QUICK_REFERENCE.md                  ← Command cheat sheet
│
├── 📚 docs/
│   ├── OVHCLOUD_SETUP_GUIDE.md         ← Step-by-step OVHcloud setup ⭐
│   ├── DATABASE_SETUP.md               ← PostgreSQL configuration
│   └── SSL_SETUP.md                    ← HTTPS/TLS with cert-manager
│
├── 🐳 docker/
│   └── admin/
│       ├── Dockerfile                  ← Admin frontend build
│       └── nginx.conf                  ← NGINX configuration
│
├── ☸️ k8s/                             ← Kubernetes manifests
│   ├── namespaces/
│   │   └── myb-namespace.yaml
│   ├── secrets/                        ← ⚠️ UPDATE THESE
│   │   ├── database-secrets.yaml
│   │   ├── keycloak-secrets.yaml
│   │   └── smtp-secrets.yaml
│   ├── config/
│   │   └── app-config.yaml
│   ├── services/
│   │   ├── rabbitmq/deployment.yaml
│   │   ├── keycloak/deployment.yaml
│   │   ├── coproperty/deployment.yaml
│   │   ├── invoice/deployment.yaml
│   │   ├── mailer/deployment.yaml
│   │   └── admin/deployment.yaml
│   ├── ingress/
│   │   └── ingress.yaml
│   └── autoscaling/
│       └── hpa.yaml                    ← Auto-scaling config
│
├── 🔧 scripts/
│   ├── build-images.sh                 ← Build & push Docker images
│   ├── deploy.sh                       ← Deploy to Kubernetes
│   └── cleanup.sh                      ← Remove all resources
│
├── .gitignore                          ← Protect secrets from Git
└── CI/CD
    └── .github/workflows/deploy-ovhcloud.yml
```

---

## 📖 How to Navigate

### 🎯 If You're Starting Right Now

1. **[START_HERE.md](./START_HERE.md)** — Your 5-minute overview & timeline
2. **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** — Print this, keep it handy
3. **[docs/OVHCLOUD_SETUP_GUIDE.md](./docs/OVHCLOUD_SETUP_GUIDE.md)** — Follow step-by-step during setup

### 🚀 If You're Ready to Deploy

1. **[README.md](./README.md)** — Full deployment guide
2. **Update these files** with your OVHcloud credentials:
   - `k8s/secrets/database-secrets.yaml`
   - `k8s/secrets/keycloak-secrets.yaml`
   - `k8s/secrets/smtp-secrets.yaml`
   - `scripts/build-images.sh`
3. **Run**: `./scripts/build-images.sh && ./scripts/deploy.sh`

### 🔧 If You Need to Troubleshoot

- **Commands**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Database issues**: [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md)
- **SSL/TLS issues**: [docs/SSL_SETUP.md](./docs/SSL_SETUP.md)
- **Deployment problems**: [README.md#troubleshooting](./README.md#troubleshooting)

### 🤖 If You Want CI/CD Automation

- **GitHub Actions**: [.github/workflows/deploy-ovhcloud.yml](../.github/workflows/deploy-ovhcloud.yml)
- Follow "Set up Kubeconfig for GitHub" section in [README.md](./README.md)

---

## 📋 What Each File Does

### Documentation Files

| File | Purpose | Read When |
|------|---------|-----------|
| **START_HERE.md** | Roadmap & overview | Just started |
| **SETUP_CHECKLIST.md** | Quick checklist (printable) | During OVHcloud setup |
| **docs/OVHCLOUD_SETUP_GUIDE.md** | Detailed step-by-step | Following checklist |
| **README.md** | Complete deployment guide | Before deploying |
| **DEPLOYMENT_SUMMARY.md** | What's included + checklist | Planning phase |
| **QUICK_REFERENCE.md** | Command cheat sheet | After deployment |
| **docs/DATABASE_SETUP.md** | DB management & backup | Database operations |
| **docs/SSL_SETUP.md** | HTTPS configuration | Production setup |

### Configuration Files

| File | Purpose | Update? |
|------|---------|---------|
| `k8s/namespaces/myb-namespace.yaml` | Kubernetes namespace | ❌ No |
| `k8s/secrets/database-secrets.yaml` | DB credentials | ⚠️ **YES** |
| `k8s/secrets/keycloak-secrets.yaml` | Keycloak passwords | ⚠️ **YES** |
| `k8s/secrets/smtp-secrets.yaml` | SMTP config | ⚠️ **YES** |
| `k8s/config/app-config.yaml` | Application config | ❌ No |
| `k8s/ingress/ingress.yaml` | HTTP routing | ⚠️ Maybe (domain) |
| `k8s/autoscaling/hpa.yaml` | Auto-scaling | ❌ No |

### Kubernetes Service Files

| Service | File | Replicas | Scaling |
|---------|------|----------|---------|
| **RabbitMQ** | services/rabbitmq/deployment.yaml | 1 | Manual |
| **Keycloak** | services/keycloak/deployment.yaml | 1 | Manual |
| **Coproperty** | services/coproperty/deployment.yaml | 2 | ✅ Auto (2-10) |
| **Invoice** | services/invoice/deployment.yaml | 2 | ✅ Auto (2-8) |
| **Mailer** | services/mailer/deployment.yaml | 2 | ✅ Auto (2-5) |
| **Admin Frontend** | services/admin/deployment.yaml | 2 | ✅ Auto (2-5) |

### Deployment Scripts

| Script | What It Does | Time |
|--------|--------------|------|
| **build-images.sh** | Builds 4 Docker images & pushes to registry | ~10 min |
| **deploy.sh** | Deploys everything to Kubernetes | ~5 min |
| **cleanup.sh** | Deletes all resources (careful!) | 1 min |

---

## ⚡ Quick Commands Reference

### OVHcloud Setup (during Phase 1-4)
```bash
# Verify kubectl connection
kubectl cluster-info

# Connect to PostgreSQL
psql "postgresql://USER:PASS@HOST:PORT/DB?sslmode=require"

# Login to container registry
docker login registry.gra7.container-registry.ovh.net
```

### Build & Deploy (when ready)
```bash
# Set environment
export DOCKER_REGISTRY="registry.gra7.container-registry.ovh.net/myb"
export KUBECONFIG=~/.kube/config-myb-staging

# Build
./ovhcloud/scripts/build-images.sh

# Deploy
./ovhcloud/scripts/deploy.sh

# Monitor
kubectl get pods -n myb-platform -w
```

### Troubleshooting
```bash
# View logs
kubectl logs -f deployment/myb-coproperty -n myb-platform

# Describe pod (see events)
kubectl describe pod <pod-name> -n myb-platform

# Get ingress IP
kubectl get ingress myb-ingress -n myb-platform

# Port forward for testing
kubectl port-forward svc/myb-coproperty 8088:8088 -n myb-platform
```

---

## 🎓 Learning Path

**Total time to deployment: 45 minutes**

1. **5 min** — Read [START_HERE.md](./START_HERE.md)
2. **30 min** — Follow [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) + [docs/OVHCLOUD_SETUP_GUIDE.md](./docs/OVHCLOUD_SETUP_GUIDE.md)
3. **10 min** — Update 4 configuration files with your credentials
4. **5 min** — Run `build-images.sh` and `deploy.sh`
5. **Done!** 🎉 Your app is live

---

## 📞 Support Matrix

| Issue | Document |
|-------|----------|
| Account setup | [docs/OVHCLOUD_SETUP_GUIDE.md](./docs/OVHCLOUD_SETUP_GUIDE.md) |
| Kubernetes error | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| DB connection failed | [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) |
| HTTPS not working | [docs/SSL_SETUP.md](./docs/SSL_SETUP.md) |
| Pod not starting | [README.md#troubleshooting](./README.md#troubleshooting) |
| Deployment fails | [QUICK_REFERENCE.md#troubleshooting](./QUICK_REFERENCE.md#troubleshooting) |
| Cost/billing issues | [README.md#cost-estimation](./README.md#cost-estimation) |

---

## 💡 Pro Tips

1. **Print [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** — Easier to follow on paper
2. **Use a password manager** — Keep your OVHcloud credentials secure
3. **Read [docs/OVHCLOUD_SETUP_GUIDE.md](./docs/OVHCLOUD_SETUP_GUIDE.md) once** — It answers 90% of questions
4. **Bookmark [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** — You'll use it daily after deployment
5. **Monitor costs** — Check OVHcloud billing weekly initially

---

## ✅ Completion Tracking

Track your progress through deployment:

- **Phase 0** (5 min): Read [START_HERE.md](./START_HERE.md) ← You are here
- **Phase 1** (10 min): Create Public Cloud project
- **Phase 2** (15 min): Create Kubernetes cluster
- **Phase 3** (10 min): Create PostgreSQL database
- **Phase 4** (5 min): Create container registry
- **Phase 5** (10 min): Update configuration files ⚠️ Critical
- **Phase 6** (10 min): Build Docker images
- **Phase 7** (5 min): Deploy to Kubernetes
- **Phase 8** (5 min): Configure DNS & SSL (optional)

**Total: ~45 minutes**

---

## 🚀 Next Steps

1. **Open**: [START_HERE.md](./START_HERE.md)
2. **Follow**: The roadmap
3. **Ask**: Me anything (I'm here to help!)

**Your deployment awaits!** 🎉

---

Last Updated: April 21, 2026 | Version 1.0.0
