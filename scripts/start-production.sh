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
║   MYB - Production Startup                       ║
║   Starting All Services                          ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    error ".env.production file not found!"
fi

# ==============================================================================
# Start Services
# ==============================================================================
step "Starting production services..."

# Stop any running containers
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Start with production environment
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

success "All services started"

# ==============================================================================
# Wait for services to be healthy
# ==============================================================================
step "Waiting for services to be healthy..."

sleep 10

# Check database health
info "Checking databases..."
for db in postgres-user postgres-document postgres-invoice postgres-timesheet; do
    if docker ps --filter "name=myb-$db" --filter "health=healthy" | grep -q myb-$db; then
        success "$db is healthy"
    else
        error "$db is not healthy"
    fi
done

# Check Keycloak
info "Waiting for Keycloak..."
timeout=180
elapsed=0
while ! docker ps --filter "name=myb-keycloak" --filter "health=healthy" | grep -q myb-keycloak; do
    if [ $elapsed -ge $timeout ]; then
        error "Keycloak failed to start within ${timeout}s"
    fi
    echo -n "."
    sleep 5
    elapsed=$((elapsed + 5))
done
echo ""
success "Keycloak is healthy"

# Check backend services
info "Checking backend services..."
for service in user-service document-service invoice-service timesheet-service; do
    if docker ps --filter "name=myb-$service" | grep -q myb-$service; then
        success "$service is running"
    else
        error "$service is not running"
    fi
done

# Check frontend
info "Checking frontend..."
if docker ps --filter "name=myb-frontend" | grep -q myb-frontend; then
    success "frontend is running"
else
    error "frontend is not running"
fi

# ==============================================================================
# Display Status
# ==============================================================================
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          All Services Running! 🚀                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

PUBLIC_IP=$(curl -s ifconfig.me)

echo -e "${BLUE}Access your application:${NC}"
echo ""
echo "  Frontend:        http://$PUBLIC_IP:4200"
echo "  Keycloak Admin:  http://$PUBLIC_IP:8080"
echo ""
echo -e "${BLUE}Backend Services (GraphQL):${NC}"
echo ""
echo "  UserService:     http://$PUBLIC_IP:5001/graphql"
echo "  DocumentService: http://$PUBLIC_IP:5002/graphql"
echo "  InvoiceService:  http://$PUBLIC_IP:5003/graphql"
echo "  TimesheetService: http://$PUBLIC_IP:5004/graphql"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo ""
echo "  View logs:       docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop services:   docker compose -f docker-compose.prod.yml down"
echo "  Restart service: docker compose -f docker-compose.prod.yml restart <service-name>"
echo "  View status:     docker compose -f docker-compose.prod.yml ps"
echo ""
success "Production deployment complete!"
