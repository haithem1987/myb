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

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  MYB - Backend Services Only (No Frontend)                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

step "Starting all backend services in Docker..."
info "Frontend will NOT be started (run it manually with nx serve)"
echo ""

# Use the dev compose file that excludes frontend
docker compose -f docker-compose.dev.yml up -d --build

success "Backend services starting!"
echo ""

info "Service Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Keycloak:          http://localhost:8080"
echo "  User Manager:      http://localhost:8087"
echo "  Timesheet:         http://localhost:8082"
echo "  Document:          http://localhost:8086"
echo "  Invoice:           http://localhost:8083"
echo "  Payment:           http://localhost:8084"
echo "  Notification:      http://localhost:8085"
echo "  Coproperty:        http://localhost:8088"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

info "Database Ports:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Keycloak DB:       localhost:5450"
echo "  Timesheet DB:      localhost:5448"
echo "  Document DB:       localhost:5433"
echo "  Invoice DB:        localhost:5434"
echo "  Coproperty DB:     localhost:5435"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

info "To run frontend locally:"
echo "  cd src/front/myb.front"
echo "  npx nx serve client        # For client app"
echo "  npx nx serve admin         # For admin app"
echo ""

info "Useful commands:"
echo "  docker compose -f docker-compose.dev.yml logs -f         # View all logs"
echo "  docker compose -f docker-compose.dev.yml logs -f keycloak # View specific service"
echo "  docker compose -f docker-compose.dev.yml down             # Stop all services"
echo "  docker compose -f docker-compose.dev.yml ps               # Check status"
echo ""

success "Backend is ready for development! 🚀"
