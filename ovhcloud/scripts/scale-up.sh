#!/bin/bash
# Scale up all MYB Platform workloads (morning startup)
# Restores all services to operational state

set -e

NAMESPACE="${NAMESPACE:-myb-platform}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MYB Platform - Scale UP (Morning)${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if kubectl is configured
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo -e "${RED}Error: kubectl is not configured${NC}"
    exit 1
fi

echo -e "${BLUE}Scaling workloads back up in namespace: $NAMESPACE${NC}\n"

# List of deployments to scale up (in dependency order)
DEPLOYMENTS=(
    "rabbitmq:1"
    "keycloak:1"
    "myb-coproperty:1"
    "myb-invoice:1"
    "myb-mailer:1"
    "myb-admin:1"
    "myb-client:1"
)

# Scale each deployment back to 1 replica
for deployment_spec in "${DEPLOYMENTS[@]}"; do
    IFS=':' read -r deployment replicas <<< "$deployment_spec"
    echo -e "${YELLOW}Scaling $deployment → $replicas replicas...${NC}"
    if kubectl scale deployment/"$deployment" --replicas="$replicas" -n "$NAMESPACE" 2>/dev/null; then
        echo -e "${GREEN}✓ $deployment scaled to $replicas${NC}"
    else
        echo -e "${YELLOW}⚠ $deployment not found${NC}"
    fi
done

echo -e "\n${YELLOW}Waiting for services to become ready...${NC}"
sleep 15

# Wait for critical services
echo -e "\n${YELLOW}Checking deployment status:${NC}"
kubectl rollout status deployment/keycloak -n "$NAMESPACE" --timeout=180s || true
kubectl rollout status deployment/myb-coproperty -n "$NAMESPACE" --timeout=180s || true

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Scale-up complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Current status:${NC}"
kubectl get deployments -n "$NAMESPACE"

echo -e "\n${BLUE}Pods:${NC}"
kubectl get pods -n "$NAMESPACE"

echo -e "\n${BLUE}Ingress IP:${NC}"
INGRESS_IP=$(kubectl get ingress myb-ingress -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
echo -e "  $INGRESS_IP"

echo -e "\n${YELLOW}Access URLs:${NC}"
if [ "$INGRESS_IP" != "pending" ] && [ ! -z "$INGRESS_IP" ]; then
    echo -e "  Admin: http://${INGRESS_IP}/admin"
    echo -e "  Client: http://${INGRESS_IP}/"
    echo -e "  Keycloak: http://${INGRESS_IP}/auth"
else
    echo -e "  ${YELLOW}Ingress IP still pending, check again in 30 seconds${NC}"
    echo -e "  kubectl get ingress -n $NAMESPACE"
fi

echo -e "\n${BLUE}To scale back down (evening), run:${NC}"
echo -e "  ./ovhcloud/scripts/scale-down.sh"
