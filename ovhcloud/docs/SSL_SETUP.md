# SSL/TLS Configuration with cert-manager

This guide explains how to set up HTTPS for your MYB platform using cert-manager and Let's Encrypt.

## Prerequisites

- Domain name pointed to your ingress IP
- Kubernetes cluster running
- Ingress controller installed (NGINX)

## Step 1: Install cert-manager

```bash
# Add the Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Verify installation
kubectl get pods --namespace cert-manager
```

## Step 2: Create ClusterIssuer

Create `ovhcloud/k8s/cert-manager/cluster-issuer.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    # Production Let's Encrypt server
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com  # Change this!
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: nginx
---
# Staging issuer for testing
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com  # Change this!
    privateKeySecretRef:
      name: letsencrypt-staging-key
    solvers:
    - http01:
        ingress:
          class: nginx
```

Apply:
```bash
kubectl apply -f ovhcloud/k8s/cert-manager/cluster-issuer.yaml
```

## Step 3: Update Ingress with TLS

Edit `ovhcloud/k8s/ingress/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myb-ingress
  namespace: myb-platform
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # Add this
    nginx.ingress.kubernetes.io/ssl-redirect: "true"    # Change to true
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:  # Add this section
  - hosts:
    - myb.yourdomain.com
    secretName: myb-tls-cert
  rules:
  - host: myb.yourdomain.com  # Update this
    http:
      paths:
      - path: /admin
        pathType: Prefix
        backend:
          service:
            name: myb-admin
            port:
              number: 80
      # ... rest of paths
```

Apply:
```bash
kubectl apply -f ovhcloud/k8s/ingress/ingress.yaml
```

## Step 4: Verify Certificate

```bash
# Check certificate status
kubectl get certificate -n myb-platform

# Describe certificate
kubectl describe certificate myb-tls-cert -n myb-platform

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# View certificate details
kubectl get secret myb-tls-cert -n myb-platform -o yaml
```

Certificate should show `Ready: True` within 2-3 minutes.

## Step 5: Test HTTPS

```bash
# Get ingress IP
kubectl get ingress myb-ingress -n myb-platform

# Test HTTPS
curl -I https://myb.yourdomain.com/admin

# Check certificate
openssl s_client -connect myb.yourdomain.com:443 -servername myb.yourdomain.com
```

## Troubleshooting

### Certificate Stuck in Pending

```bash
# Check certificate request
kubectl get certificaterequest -n myb-platform
kubectl describe certificaterequest <name> -n myb-platform

# Check challenges
kubectl get challenge -n myb-platform
kubectl describe challenge <name> -n myb-platform
```

### Rate Limit Errors

Let's Encrypt has rate limits:
- Use staging issuer for testing
- Production: 50 certificates per domain per week

### HTTP-01 Challenge Failing

Ensure:
- Domain DNS points to ingress IP
- Port 80 is accessible
- Ingress controller is running

## Renewal

Certificates auto-renew 30 days before expiration. Check:

```bash
# View certificate expiry
kubectl get certificate myb-tls-cert -n myb-platform -o jsonpath='{.status.notAfter}'
```

## Multiple Domains

For multiple domains, add to TLS section:

```yaml
spec:
  tls:
  - hosts:
    - myb.yourdomain.com
    - admin.yourdomain.com
    - api.yourdomain.com
    secretName: myb-tls-cert
```

## Wildcard Certificates

Requires DNS-01 challenge:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-dns
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-dns-key
    solvers:
    - dns01:
        # Configure your DNS provider
        # Example for OVH:
        webhook:
          groupName: acme.yourcompany.com
          solverName: ovh
```

Requires additional DNS provider configuration.

## References

- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Let's Encrypt Rate Limits](https://letsencrypt.org/docs/rate-limits/)
- [NGINX Ingress TLS](https://kubernetes.github.io/ingress-nginx/user-guide/tls/)
