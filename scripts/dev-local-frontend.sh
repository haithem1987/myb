#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
error() { echo -e "${RED}❌ Error: $1${NC}" >&2; exit 1; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
step() { echo -e "${BLUE}▶ $1${NC}"; }

# Validate we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml not found. Please run this script from the project root."
fi

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  MYB - Local Frontend Development Mode                    ║${NC}"
echo -e "${GREEN}║  Frontend runs locally | Backend services in Docker        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the app to run (admin or client)
APP_NAME=${1:-"client"}

if [ "$APP_NAME" != "admin" ] && [ "$APP_NAME" != "client" ]; then
    error "Invalid app name. Use 'admin' or 'client'. Example: ./scripts/dev-local-frontend.sh client"
fi

step "Starting backend services in Docker (excluding frontend)..."
docker compose up -d --build \
    keycloak \
    keycloak-db \
    timesheetDB \
    documentDB \
    invoiceDB \
    copropertyDB \
    myb-usermanager \
    myb-timesheet \
    myb-docmanager \
    myb-invoice \
    myb-payment \
    myb-notification \
    myb-coproperty

success "Backend services starting in Docker..."
echo ""

# Wait for services to be healthy
step "Waiting for services to be ready..."
info "This may take 30-60 seconds..."
sleep 10

# Check Keycloak health
info "Checking Keycloak status..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        success "Keycloak is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "Keycloak failed to start. Check logs: docker compose logs keycloak"
fi

echo ""
step "Installing frontend dependencies..."
cd src/front/myb.front
npm install
success "Dependencies installed!"
echo ""

step "Starting $APP_NAME frontend locally..."
info "Frontend will be available at: http://localhost:4200"
info "Press Ctrl+C to stop the frontend (backend services will keep running)"
echo ""

# Run the frontend
npx nx serve $APP_NAME --host 0.0.0.0 --port 4200

# If user stops the frontend, ask about backend services
echo ""
read -p "Do you want to stop backend services too? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    step "Stopping backend services..."
    cd /Volumes/NidhalSSD/Projects/myb
    docker compose down
    success "All services stopped!"
else
    info "Backend services are still running. To stop them later:"
    echo "   docker compose down"
fi
