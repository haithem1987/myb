#!/bin/bash

# MYB Docker Hub Push Script
# Builds and pushes all MYB services to Docker Hub for Render deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

error() { echo -e "${RED}❌ Error: $1${NC}" >&2; exit 1; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Configuration
DOCKER_USERNAME="${1:-}"
VERSION="${2:-1.0.0}"
PROJECT_ROOT="/Volumes/NidhalSSD/Projects/myb"

# Validate Docker Hub username
if [ -z "$DOCKER_USERNAME" ]; then
    error "Docker Hub username is required\nUsage: $0 <dockerhub-username> [version]"
fi

info "Docker Hub Username: $DOCKER_USERNAME"
info "Version Tag: $VERSION"
echo ""

# Check if logged in to Docker Hub
info "Checking Docker Hub authentication..."
if ! docker info &> /dev/null; then
    error "Docker daemon is not running"
fi

# Try to login
docker login || error "Failed to login to Docker Hub"
success "Logged in to Docker Hub"

# Define services
declare -A SERVICES=(
    ["usermanager"]="src/services/user-manager/Myb.UserManager/Dockerfile"
    ["timesheet"]="src/services/time-sheet/Myb.Timesheet/Dockerfile"
    ["docmanager"]="src/services/document-management/Myb.Document/Dockerfile"
    ["invoice"]="src/services/invoice-management/Myb.Invoice/Dockerfile"
    ["payment"]="src/services/payment-service/Myb.Payment/Dockerfile"
    ["notification"]="src/services/notification-service/Myb.Notification/Dockerfile"
    ["coproperty"]="src/services/coproperty-management/Myb.Coproperty/Dockerfile"
    ["frontend"]="src/front/myb.front/Dockerfile"
)

# Change to project root
cd "$PROJECT_ROOT" || error "Failed to change to project directory"

# Build and push each service
TOTAL=${#SERVICES[@]}
CURRENT=0

echo ""
info "Building and pushing $TOTAL services..."
echo ""

for service in "${!SERVICES[@]}"; do
    CURRENT=$((CURRENT + 1))
    IMAGE_NAME="${DOCKER_USERNAME}/myb-${service}"
    DOCKERFILE="${SERVICES[$service]}"
    
    echo "════════════════════════════════════════════════════════════"
    info "[$CURRENT/$TOTAL] Building: myb-${service}"
    echo "════════════════════════════════════════════════════════════"
    
    # Check if Dockerfile exists
    if [ ! -f "$DOCKERFILE" ]; then
        warning "Dockerfile not found: $DOCKERFILE (SKIPPED)"
        continue
    fi
    
    # Build image
    info "Building ${IMAGE_NAME}:${VERSION}..."
    if docker build -f "$DOCKERFILE" -t "${IMAGE_NAME}:${VERSION}" . ; then
        success "Build completed: ${IMAGE_NAME}:${VERSION}"
    else
        error "Build failed for $service"
    fi
    
    # Tag as latest
    info "Tagging as latest..."
    docker tag "${IMAGE_NAME}:${VERSION}" "${IMAGE_NAME}:latest"
    
    # Push version tag
    info "Pushing ${IMAGE_NAME}:${VERSION}..."
    if docker push "${IMAGE_NAME}:${VERSION}"; then
        success "Pushed: ${IMAGE_NAME}:${VERSION}"
    else
        error "Push failed for ${IMAGE_NAME}:${VERSION}"
    fi
    
    # Push latest tag
    info "Pushing ${IMAGE_NAME}:latest..."
    if docker push "${IMAGE_NAME}:latest"; then
        success "Pushed: ${IMAGE_NAME}:latest"
    else
        error "Push failed for ${IMAGE_NAME}:latest"
    fi
    
    echo ""
done

# Summary
echo "════════════════════════════════════════════════════════════"
success "All services built and pushed successfully!"
echo "════════════════════════════════════════════════════════════"
echo ""
info "Images available at:"
for service in "${!SERVICES[@]}"; do
    echo "  • ${DOCKER_USERNAME}/myb-${service}:${VERSION}"
    echo "  • ${DOCKER_USERNAME}/myb-${service}:latest"
done
echo ""
info "Next steps:"
echo "  1. Go to https://dashboard.render.com"
echo "  2. Create PostgreSQL databases (5 total)"
echo "  3. Create web services using these Docker images"
echo "  4. Configure environment variables"
echo "  5. Deploy!"
echo ""
success "Ready for Render deployment! 🚀"
