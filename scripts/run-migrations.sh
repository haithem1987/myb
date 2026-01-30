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
║   MYB - Database Migration Runner                ║
║   Apply Database Migrations                      ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    error ".env.production file not found!"
fi

# Load environment variables
set -a
source .env.production
set +a

# ==============================================================================
# Run Migrations
# ==============================================================================

run_migration() {
    local service=$1
    local db_container=$2
    
    step "Running migrations for $service..."
    
    # Check if service container is running
    if ! docker ps --filter "name=myb-${service,,}" | grep -q myb-${service,,}; then
        error "$service container is not running"
    fi
    
    # Run migrations inside the service container
    docker exec myb-${service,,} dotnet ef database update --no-build || {
        error "Failed to run migrations for $service"
    }
    
    success "$service migrations completed"
}

# Run migrations for all services
info "Starting database migrations..."
echo ""

run_migration "user-service" "postgres-user"
run_migration "document-service" "postgres-document"
run_migration "invoice-service" "postgres-invoice"
run_migration "timesheet-service" "postgres-timesheet"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     All Migrations Completed! ✅                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Verify databases
step "Verifying database connections..."

verify_db() {
    local db_name=$1
    local container=$2
    
    docker exec myb-$container psql -U ${DB_USER:-myb_admin} -d $db_name -c "\dt" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        success "$db_name: Connected and tables created"
    else
        error "$db_name: Connection failed"
    fi
}

verify_db "UserDB" "postgres-user"
verify_db "DocumentDB" "postgres-document"
verify_db "InvoiceDB" "postgres-invoice"
verify_db "TimesheetDB" "postgres-timesheet"

echo ""
success "Database migration and verification complete!"
