#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
success() { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Stopping MYB Development Environment                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check which compose file is running
if docker compose -f docker-compose.dev.yml ps > /dev/null 2>&1; then
    info "Stopping backend services (dev mode)..."
    docker compose -f docker-compose.dev.yml down
else
    info "Stopping all services (full stack)..."
    docker compose down
fi

success "All Docker services stopped!"
echo ""

info "Data is preserved in Docker volumes. To remove volumes:"
echo "  docker compose down -v"
