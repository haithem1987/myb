#!/bin/bash
# Scale down all MYB Platform workloads to zero (pause mode)
# Runs in the evening to reduce costs
# Database and registry remain running

set -e

NAMESPACE="${NAMESPACE:-myb-platform}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}MYB Platform - Scale DOWN (Evening)${NC}"
echo -e "${YELLOW}========================================${NC}"

# Check if kubectl is configured
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo -e "${RED}Error: kubectl is not configured${NC}"
    exit 1
fi

echo -e "${BLUE}Scaling workloads to zero in namespace: $NAMESPACE${NC}\n"

# List of deployments to scale down
DEPLOYMENTS=(
    "myb-client"
    "myb-admin"
    "myb-mailer"
    "myb-invoice"
    "myb-coproperty"
    "keycloak"
    "rabbitmq"
)

# Scale each deployment to 0
for deployment in "${DEPLOYMENTS[@]}"; do
    echo -e "${YELLOW}Scaling $deployment → 0 replicas...${NC}"
    if kubectl scale deployment/"$deployment" --replicas=0 -n "$NAMESPACE" 2>/dev/null; then
        echo -e "${GREEN}✓ $deployment scaled to 0${NC}"
    else
        echo -e "${YELLOW}⚠ $deployment not found or already scaled${NC}"
    fi
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Scale-down complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Status:${NC}"
kubectl get deployments -n "$NAMESPACE"

echo -e "\n${YELLOW}Estimated savings:${NC}"
echo -e "  • Kubernetes compute: STOPPED (€0)"
echo -e "  • Database (PostgreSQL): Still running (~€50/month)"
echo -e "  • Container Registry: Still running (~€10/month)"
echo -e "  • Total active cost during downtime: ~€60/month"

echo -e "\n${BLUE}To scale back up, run:${NC}"
echo -e "  ./ovhcloud/scripts/scale-up.sh"
