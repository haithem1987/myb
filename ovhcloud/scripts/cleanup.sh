#!/bin/bash
# Cleanup/Teardown MYB Platform from OVHCloud Kubernetes

set -e

NAMESPACE="myb-platform"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
K8S_DIR="$PROJECT_ROOT/ovhcloud/k8s"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}MYB Platform - Cleanup${NC}"
echo -e "${RED}========================================${NC}"

echo -e "${YELLOW}This will DELETE all resources in namespace: $NAMESPACE${NC}"
echo -e "${RED}This action CANNOT be undone!${NC}"
echo -e "\n${YELLOW}Are you sure you want to continue? (type 'yes' to confirm)${NC}"
read -r response

if [[ "$response" != "yes" ]]; then
    echo -e "${GREEN}Cleanup cancelled${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Deleting all resources...${NC}"

# Delete in reverse order
kubectl delete -f "$K8S_DIR/ingress/" --ignore-not-found=true
kubectl delete -f "$K8S_DIR/services/" --ignore-not-found=true -R
kubectl delete -f "$K8S_DIR/config/" --ignore-not-found=true
kubectl delete -f "$K8S_DIR/secrets/" --ignore-not-found=true

echo -e "\n${YELLOW}Deleting namespace...${NC}"
kubectl delete namespace "$NAMESPACE" --ignore-not-found=true

echo -e "\n${GREEN}Cleanup complete!${NC}"
echo -e "${YELLOW}Note: Persistent volumes may still exist. Check with:${NC}"
echo -e "  kubectl get pv"
