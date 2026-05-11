#!/bin/bash
# ============================================================
# configure-domain.sh
# Configures myb-platform.com on the myb-coproperty-k8s cluster
# - Installs cert-manager (if not present)
# - Creates Let's Encrypt ClusterIssuers
# - Applies the updated ingress (domain + TLS)
# ============================================================

set -e

DOMAIN="myb-platform.com"
NAMESPACE="myb-platform"
CERT_MANAGER_VERSION="v1.15.3"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export KUBECONFIG="$PROJECT_ROOT/ovhcloud/kubeconfig-ebak4v.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  MYB Platform – Domain Configuration${NC}"
echo -e "${GREEN}  Domain : $DOMAIN${NC}"
echo -e "${GREEN}  Cluster: myb-coproperty-k8s (SBG5)${NC}"
echo -e "${GREEN}============================================================${NC}"

# ── 0. Preflight ───────────────────────────────────────────
echo -e "\n${BLUE}[0/5] Checking prerequisites...${NC}"
for cmd in kubectl helm curl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo -e "${RED}✗ '$cmd' not found. Please install it first.${NC}"; exit 1
  fi
done

if ! kubectl cluster-info &>/dev/null; then
  echo -e "${RED}✗ Cannot reach the cluster. Check kubeconfig: $KUBECONFIG${NC}"; exit 1
fi
echo -e "${GREEN}✓ kubectl connected${NC}"

# ── 1. DNS reminder ────────────────────────────────────────
echo -e "\n${YELLOW}[1/5] DNS – IMPORTANT${NC}"
INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

if [[ -z "$INGRESS_IP" ]]; then
  echo -e "${YELLOW}⚠ Could not auto-detect ingress IP. Using known floating IP.${NC}"
  INGRESS_IP="54.38.0.191"
fi

echo -e "${BLUE}Ingress IP: ${INGRESS_IP}${NC}"
echo -e "Make sure these DNS A-records are set in the OVHcloud console:"
echo -e "  ${DOMAIN}     → ${INGRESS_IP}"
echo -e "  www.${DOMAIN} → ${INGRESS_IP}"
echo ""
echo -e "Current DNS resolution:"
host "$DOMAIN" 2>/dev/null | head -3 || nslookup "$DOMAIN" 2>/dev/null | grep "Address:" | tail -1 || true
echo ""
read -rp "Are DNS records already pointing to ${INGRESS_IP}? (y/N) " dns_ok
if [[ ! "$dns_ok" =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Configure DNS first, then re-run this script.${NC}"
  echo -e "OVHcloud DNS console: https://www.ovh.com/manager/web/#/domain/${DOMAIN}/zone"
  exit 0
fi

# ── 2. Install cert-manager ────────────────────────────────
echo -e "\n${BLUE}[2/5] cert-manager...${NC}"
if kubectl get namespace cert-manager &>/dev/null; then
  echo -e "${GREEN}✓ cert-manager namespace already exists – skipping install${NC}"
else
  echo -e "${YELLOW}Installing cert-manager ${CERT_MANAGER_VERSION}...${NC}"
  kubectl apply -f \
    "https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml"

  echo -e "${YELLOW}Waiting for cert-manager pods to be ready (up to 120s)...${NC}"
  kubectl wait --for=condition=available deployment \
    --all -n cert-manager --timeout=120s
  echo -e "${GREEN}✓ cert-manager installed${NC}"
fi

# ── 3. Apply ClusterIssuers ────────────────────────────────
echo -e "\n${BLUE}[3/5] Applying ClusterIssuers...${NC}"
kubectl apply -f "$PROJECT_ROOT/ovhcloud/k8s/cert-manager/cluster-issuer.yaml"
echo -e "${GREEN}✓ ClusterIssuers applied${NC}"

# ── 4. Apply updated ingress ───────────────────────────────
echo -e "\n${BLUE}[4/5] Applying ingress for ${DOMAIN}...${NC}"
kubectl apply -f "$PROJECT_ROOT/ovhcloud/k8s/ingress/ingress.yaml"
echo -e "${GREEN}✓ Ingress applied${NC}"

# ── 5. Verify certificate ──────────────────────────────────
echo -e "\n${BLUE}[5/5] Certificate status (may take 2-3 min to become Ready)...${NC}"
echo -e "${YELLOW}Waiting 30s before checking...${NC}"
sleep 30

kubectl get certificate -n "$NAMESPACE" 2>/dev/null || echo "(no certificates yet, normal if cert-manager just installed)"
kubectl get ingress -n "$NAMESPACE"

echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  Done!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo -e "Test URLs once the certificate is Ready:"
echo -e "  https://${DOMAIN}/          → Owner portal"
echo -e "  https://${DOMAIN}/admin     → Admin panel"
echo -e "  https://${DOMAIN}/auth      → Keycloak"
echo ""
echo -e "Monitor certificate:"
echo -e "  kubectl describe certificate myb-platform-tls -n ${NAMESPACE}"
echo -e "  kubectl get challenges -n ${NAMESPACE}"
