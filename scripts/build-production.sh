#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
error() { echo -e "${RED}❌ Error: $1${NC}" >&2; exit 1; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
step() { echo -e "${BLUE}🔧 $1${NC}"; }

# Banner
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║   MYB - Production Build Script                  ║
║   Building Docker Images for Production          ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    error ".env.production file not found! Run deploy-oracle-cloud.sh first."
fi

# Load environment variables
set -a
source .env.production
set +a

success "Environment variables loaded"

# ==============================================================================
# Build Backend Services
# ==============================================================================
step "Building backend services..."

info "Building UserService..."
docker build -t myb-user-service:latest \
    -f src/services/UserService/Dockerfile .

info "Building DocumentService..."
docker build -t myb-document-service:latest \
    -f src/services/DocumentService/Dockerfile .

info "Building InvoiceService..."
docker build -t myb-invoice-service:latest \
    -f src/services/InvoiceService/Dockerfile .

info "Building TimesheetService..."
docker build -t myb-timesheet-service:latest \
    -f src/services/TimesheetService/Dockerfile .

success "Backend services built successfully"

# ==============================================================================
# Build Frontend
# ==============================================================================
step "Building frontend..."

cd src/front/myb.front

docker build -t myb-frontend:latest \
    -f Dockerfile.prod \
    --build-arg KEYCLOAK_URL="${KEYCLOAK_URL}" \
    --build-arg API_URL="${FRONTEND_URL}" \
    .

cd ../../../

success "Frontend built successfully"

# ==============================================================================
# Summary
# ==============================================================================
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Build Complete! 🎉                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

info "Docker images built:"
docker images | grep myb- | awk '{print "  - " $1 ":" $2 " (" $7 " " $8 ")"}'

echo ""
info "Next step: Run ./scripts/start-production.sh to start all services"
