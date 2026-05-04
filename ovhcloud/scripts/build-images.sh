#!/bin/bash
# Build and Push Docker Images to Container Registry
# This script builds all Docker images for OVHCloud deployment

set -e  # Exit on error

# Configuration
REGISTRY="${DOCKER_REGISTRY:-93pf2bi9.gra7.container-registry.ovh.net/myb}"  # OVHCloud Harbor Registry
TAG="${IMAGE_TAG:-latest}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MYB Platform - Docker Image Builder${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Function to build and push image
build_and_push() {
    local service=$1
    local dockerfile=$2
    local context=$3
    local image_name="${REGISTRY}/myb-${service}:${TAG}"
    
    echo -e "\n${YELLOW}Building ${service}...${NC}"
    
    cd "$PROJECT_ROOT"
    
    if docker build --platform linux/amd64 -f "$dockerfile" -t "$image_name" "$context"; then
        echo -e "${GREEN}✓ Successfully built ${service}${NC}"
        
        echo -e "${YELLOW}Pushing ${service} to registry...${NC}"
        if docker push "$image_name"; then
            echo -e "${GREEN}✓ Successfully pushed ${service}${NC}"
        else
            echo -e "${RED}✗ Failed to push ${service}${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Failed to build ${service}${NC}"
        return 1
    fi
}

# Login to registry
echo -e "\n${YELLOW}Logging in to container registry...${NC}"
echo "Please enter your registry credentials:"
docker login "$REGISTRY"

# Build backend services
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Building Backend Services${NC}"
echo -e "${GREEN}========================================${NC}"

build_and_push "coproperty" \
    "./src/services/coproperty-management/Myb.Coproperty/Dockerfile" \
    "."

build_and_push "notification" \
    "./src/services/notification-service/Myb.Notification/Dockerfile" \
    "."

build_and_push "invoice" \
    "./src/services/invoice-management/Myb.Invoice/Dockerfile" \
    "."

build_and_push "mailer" \
    "./src/services/mailer-service/Myb.Mailer/Dockerfile" \
    "."

# Build frontend
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Building Frontend${NC}"
echo -e "${GREEN}========================================${NC}"

# Build admin frontend
build_and_push "admin" \
    "./ovhcloud/docker/admin/Dockerfile" \
    "."

# Build client (owner portal) frontend
build_and_push "client" \
    "./ovhcloud/docker/client/Dockerfile" \
    "."

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Build Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Images built and pushed:"
echo -e "  - ${REGISTRY}/myb-coproperty:${TAG}"
echo -e "  - ${REGISTRY}/myb-notification:${TAG}"
echo -e "  - ${REGISTRY}/myb-invoice:${TAG}"
echo -e "  - ${REGISTRY}/myb-mailer:${TAG}"
echo -e "  - ${REGISTRY}/myb-admin:${TAG}"
echo -e "  - ${REGISTRY}/myb-client:${TAG}"
echo -e "\n${GREEN}All images ready for deployment!${NC}"

echo -e "\n${GREEN}Next steps:${NC}"
echo -e "1. Update secrets in ovhcloud/k8s/secrets/"
echo -e "2. Run: ./ovhcloud/scripts/deploy.sh"
