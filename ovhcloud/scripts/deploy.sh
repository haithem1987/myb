#!/bin/bash
# Deploy MYB Platform to OVHCloud Kubernetes
# This script deploys all services to your OVHCloud Kubernetes cluster

set -e  # Exit on error

# Configuration
NAMESPACE="myb-platform"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
K8S_DIR="$PROJECT_ROOT/ovhcloud/k8s"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MYB Platform - OVHCloud Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if kubectl is configured
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo -e "${RED}Error: kubectl is not configured or cluster is not accessible${NC}"
    echo -e "${YELLOW}Please configure kubectl to connect to your OVHCloud cluster${NC}"
    echo -e "Run: ovhai kubeconfig download <cluster-id>"
    exit 1
fi

# Display cluster info
echo -e "\n${BLUE}Current cluster:${NC}"
kubectl cluster-info | head -n 1

echo -e "\n${YELLOW}This will deploy to cluster above. Continue? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Function to wait for resource
wait_for_resource() {
    local resource=$1
    local timeout=${2:-300}
    
    echo -e "${YELLOW}Waiting for ${resource} to be ready...${NC}"
    if kubectl wait --for=condition=available --timeout="${timeout}s" "$resource" -n "$NAMESPACE" 2>/dev/null; then
        echo -e "${GREEN}✓ ${resource} is ready${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ ${resource} is not ready yet, continuing...${NC}"
        return 1
    fi
}

# Step 1: Create namespace
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 1: Creating Namespace${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/namespaces/myb-namespace.yaml"
echo -e "${GREEN}✓ Namespace created${NC}"

# Step 2: Apply secrets
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 2: Applying Secrets${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "${RED}⚠ WARNING: Ensure you have updated all secrets before deploying!${NC}"
echo -e "${YELLOW}Check files in: $K8S_DIR/secrets/${NC}"
echo -e "\n${YELLOW}Have you updated all secrets with production values? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Please update secrets first, then run this script again${NC}"
    exit 1
fi

kubectl apply -f "$K8S_DIR/secrets/"
echo -e "${GREEN}✓ Secrets applied${NC}"

# Step 3: Apply ConfigMaps
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 3: Applying ConfigMaps${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/config/"
echo -e "${GREEN}✓ ConfigMaps applied${NC}"

# Step 4: Deploy RabbitMQ
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 4: Deploying RabbitMQ${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/services/rabbitmq/deployment.yaml"
wait_for_resource "deployment/rabbitmq" 180

# Step 5: Deploy Keycloak
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 5: Deploying Keycloak${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/services/keycloak/deployment.yaml"
wait_for_resource "deployment/keycloak" 300

# Step 6: Deploy Backend Services
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 6: Deploying Backend Services${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "${YELLOW}Deploying Coproperty Service...${NC}"
kubectl apply -f "$K8S_DIR/services/coproperty/deployment.yaml"

echo -e "${YELLOW}Deploying Invoice Service...${NC}"
kubectl apply -f "$K8S_DIR/services/invoice/deployment.yaml"

echo -e "${YELLOW}Deploying Mailer Service...${NC}"
kubectl apply -f "$K8S_DIR/services/mailer/deployment.yaml"

wait_for_resource "deployment/myb-coproperty" 180
wait_for_resource "deployment/myb-invoice" 180
wait_for_resource "deployment/myb-mailer" 180

# Step 7: Deploy Frontend
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 7: Deploying Frontend${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/services/admin/deployment.yaml"
wait_for_resource "deployment/myb-admin" 120

echo -e "${YELLOW}Deploying Client Frontend (Owner Portal)...${NC}"
kubectl apply -f "$K8S_DIR/services/client/deployment.yaml"
wait_for_resource "deployment/myb-client" 120

# Step 8: Deploy Ingress
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 8: Deploying Ingress${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/ingress/ingress.yaml"
echo -e "${GREEN}✓ Ingress deployed${NC}"

# Display deployment status
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Status${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Pods:${NC}"
kubectl get pods -n "$NAMESPACE"

echo -e "\n${BLUE}Services:${NC}"
kubectl get services -n "$NAMESPACE"

echo -e "\n${BLUE}Ingress:${NC}"
kubectl get ingress -n "$NAMESPACE"

# Get external IP
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Access Information${NC}"
echo -e "${GREEN}========================================${NC}"

INGRESS_IP=$(kubectl get ingress myb-ingress -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

if [ "$INGRESS_IP" = "pending" ] || [ -z "$INGRESS_IP" ]; then
    echo -e "${YELLOW}⚠ External IP is still being assigned...${NC}"
    echo -e "${YELLOW}Run this command to check: kubectl get ingress -n $NAMESPACE${NC}"
else
    echo -e "${GREEN}External IP: ${INGRESS_IP}${NC}"
    echo -e "\n${BLUE}Access URLs:${NC}"
    echo -e "  Admin: http://${INGRESS_IP}/admin"
    echo -e "  Keycloak: http://${INGRESS_IP}/auth"
    echo -e "  Coproperty API: http://${INGRESS_IP}/api/coproperty"
    echo -e "  Invoice API: http://${INGRESS_IP}/api/invoice"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Useful commands:${NC}"
echo -e "  View logs: kubectl logs -f deployment/<service-name> -n $NAMESPACE"
echo -e "  Check status: kubectl get all -n $NAMESPACE"
echo -e "  Describe pod: kubectl describe pod <pod-name> -n $NAMESPACE"
echo -e "  Port forward: kubectl port-forward svc/<service-name> 8080:8080 -n $NAMESPACE"
echo -e "  Update deployment: kubectl rollout restart deployment/<service-name> -n $NAMESPACE"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Configure your domain DNS to point to: ${INGRESS_IP}"
echo -e "2. Update Ingress with your domain name"
echo -e "3. Set up SSL/TLS certificates with cert-manager"
echo -e "4. Configure Keycloak realm and clients"
echo -e "5. Run database migrations"
