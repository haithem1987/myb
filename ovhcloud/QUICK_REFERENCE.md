# OVHCloud Deployment - Quick Reference

## Prerequisites Checklist

- [ ] OVHCloud account with Public Cloud project
- [ ] Kubernetes cluster created
- [ ] kubectl configured (`kubectl cluster-info` works)
- [ ] Docker installed and running
- [ ] Container registry access
- [ ] PostgreSQL databases created
- [ ] Database credentials saved
- [ ] SMTP provider configured (SendGrid/Mailgun)

## Configuration Files to Update

Before deployment, update these files with your actual values:

1. `ovhcloud/k8s/secrets/database-secrets.yaml`
   - Database hostnames
   - Database passwords
   - Connection strings

2. `ovhcloud/k8s/secrets/keycloak-secrets.yaml`
   - Admin password
   - Client secrets

3. `ovhcloud/k8s/secrets/smtp-secrets.yaml`
   - SMTP credentials
   - From email address

4. `ovhcloud/scripts/build-images.sh`
   - `DOCKER_REGISTRY` variable (line 8)

## Deployment Commands

### Full Deployment (First Time)

```bash
# 1. Build and push images
export DOCKER_REGISTRY="your-registry.com/myb"
./ovhcloud/scripts/build-images.sh

# 2. Update all secrets (see files above)

# 3. Deploy everything
./ovhcloud/scripts/deploy.sh

# 4. Check status
kubectl get all -n myb-platform
```

### Update Single Service

```bash
# Rebuild image
docker build -t $DOCKER_REGISTRY/myb-coproperty:latest \
  -f ./src/services/coproperty-management/Myb.Coproperty/Dockerfile .
docker push $DOCKER_REGISTRY/myb-coproperty:latest

# Restart deployment
kubectl rollout restart deployment/myb-coproperty -n myb-platform

# Watch rollout
kubectl rollout status deployment/myb-coproperty -n myb-platform
```

### View Logs

```bash
# All coproperty pods
kubectl logs -f -l app=myb-coproperty -n myb-platform

# Specific deployment
kubectl logs -f deployment/myb-invoice -n myb-platform

# Multiple services
kubectl logs -f -l tier=backend -n myb-platform
```

### Scale Services

```bash
# Manual scaling
kubectl scale deployment/myb-coproperty --replicas=3 -n myb-platform

# Auto-scaling
kubectl autoscale deployment/myb-coproperty \
  --cpu-percent=70 --min=2 --max=10 -n myb-platform
```

### Database Access

```bash
# Port-forward to managed database (if needed)
# Get database host from secrets
kubectl get secret database-credentials -n myb-platform -o yaml

# Connect via psql
psql "postgresql://user:pass@host:port/db?sslmode=require"
```

### Debugging

```bash
# Describe pod (see events)
kubectl describe pod <pod-name> -n myb-platform

# Shell into pod
kubectl exec -it <pod-name> -n myb-platform -- /bin/bash

# Port-forward for local testing
kubectl port-forward svc/myb-coproperty 8088:8088 -n myb-platform

# View events
kubectl get events -n myb-platform --sort-by='.lastTimestamp'
```

### Cleanup

```bash
# Delete everything
./ovhcloud/scripts/cleanup.sh

# Or manually
kubectl delete namespace myb-platform
```

## Access URLs

After deployment, get ingress IP:

```bash
kubectl get ingress myb-ingress -n myb-platform
```

Access services:
- **Admin**: http://<INGRESS_IP>/admin
- **Keycloak**: http://<INGRESS_IP>/auth
- **Coproperty API**: http://<INGRESS_IP>/api/coproperty
- **Invoice API**: http://<INGRESS_IP>/api/invoice

## Common Issues & Solutions

### Pods Stuck in Pending
```bash
kubectl describe pod <pod-name> -n myb-platform
# Check: Insufficient resources, PVC issues, image pull errors
```

### Database Connection Failed
```bash
# Test from pod
kubectl run psql-test --image=postgres:16 -n myb-platform -it --rm -- \
  psql "postgresql://user:pass@host:port/db?sslmode=require"
```

### Image Pull Error
```bash
# Create registry secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<pass> \
  -n myb-platform

# Add to deployment spec.template.spec.imagePullSecrets
```

### Service Not Responding
```bash
# Check pod status
kubectl get pods -n myb-platform

# Check service endpoints
kubectl get endpoints -n myb-platform

# Test service internally
kubectl run curl-test --image=curlimages/curl -n myb-platform -it --rm -- \
  curl http://myb-coproperty:8088/health
```

## Monitoring Commands

```bash
# Resource usage
kubectl top pods -n myb-platform
kubectl top nodes

# Get all resources
kubectl get all -n myb-platform

# Watch pods
watch kubectl get pods -n myb-platform

# Stream logs from all backend services
kubectl logs -f -l tier=backend -n myb-platform --max-log-requests=10
```

## Security

### Generate Strong Passwords

```bash
# Generate random password
openssl rand -base64 32

# Generate multiple
for i in {1..5}; do openssl rand -base64 32; done
```

### View Secret (decode base64)

```bash
kubectl get secret database-credentials -n myb-platform -o jsonpath='{.data.COPROPERTY_DB_PASSWORD}' | base64 -d
```

## Backup

```bash
# Backup all Kubernetes resources
kubectl get all -n myb-platform -o yaml > backup-$(date +%Y%m%d).yaml

# Backup secrets (be careful!)
kubectl get secrets -n myb-platform -o yaml > secrets-backup.yaml

# Database backup (from managed DB)
# See DATABASE_SETUP.md for details
```

## Performance Tuning

```bash
# Increase replicas for high traffic
kubectl scale deployment/myb-coproperty --replicas=5 -n myb-platform

# Update resource limits
kubectl set resources deployment/myb-coproperty \
  --limits=cpu=1000m,memory=2Gi \
  --requests=cpu=500m,memory=1Gi \
  -n myb-platform
```

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
alias k='kubectl'
alias kn='kubectl -n myb-platform'
alias kgp='kubectl get pods -n myb-platform'
alias kgs='kubectl get svc -n myb-platform'
alias kl='kubectl logs -f -n myb-platform'
alias kd='kubectl describe -n myb-platform'
alias kx='kubectl exec -it -n myb-platform'
```

## Next Steps After Deployment

1. Configure domain DNS → ingress IP
2. Set up SSL/TLS with cert-manager
3. Configure Keycloak realm and clients
4. Run database migrations
5. Set up monitoring (Prometheus/Grafana)
6. Configure automated backups
7. Set up CI/CD pipeline
8. Load test the deployment

## Support

- OVHCloud Support: https://help.ovhcloud.com/
- Kubernetes Docs: https://kubernetes.io/docs/
- Project Issues: GitHub/GitLab repository
