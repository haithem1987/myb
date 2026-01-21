#!/bin/bash

# Coproperty Module - Development & Testing Helper Script
# This script provides quick commands for developing and testing the coproperty module

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
FRONTEND_DIR="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front"
BACKEND_DIR="/Volumes/NidhalSSD/Projects/myb/src/services/coproperty-management"
DOCS_DIR="/Volumes/NidhalSSD/Projects/myb/docs"

# Helper functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Main menu
show_menu() {
    clear
    print_header "MYB Coproperty Management - Dev Helper"
    echo ""
    echo "  FRONTEND ACTIONS:"
    echo "  1) Start Admin App (npx nx serve admin)"
    echo "  2) Start Client App (npx nx serve client)"
    echo "  3) Build Coproperty Module"
    echo "  4) Run Frontend Tests"
    echo "  5) Lint & Format Code"
    echo ""
    echo "  BACKEND ACTIONS:"
    echo "  6) Start Coproperty Service (dotnet run)"
    echo "  7) Run Backend Tests"
    echo "  8) Create Database Migration"
    echo "  9) Apply Database Migration"
    echo ""
    echo "  DEVELOPMENT TOOLS:"
    echo "  10) Open GraphQL Playground"
    echo "  11) Check Service Status"
    echo "  12) Install Dependencies"
    echo "  13) Clean & Rebuild All"
    echo ""
    echo "  DOCUMENTATION:"
    echo "  14) View Progress Report"
    echo "  15) View Owner Portal Guide"
    echo "  16) View Implementation Guide"
    echo "  17) View Quick Start"
    echo ""
    echo "  TESTING HELPERS:"
    echo "  18) Test Owner Portal Routes"
    echo "  19) Generate Test Data (GraphQL)"
    echo "  20) Check Installation Status"
    echo ""
    echo "  0) Exit"
    echo ""
    echo -n "  Enter choice [0-20]: "
}

# Action functions
start_admin_app() {
    print_header "Starting Admin App"
    cd "$FRONTEND_DIR"
    print_info "Running: npx nx serve admin"
    npx nx serve admin
}

start_client_app() {
    print_header "Starting Client App"
    cd "$FRONTEND_DIR"
    print_info "Running: npx nx serve client"
    npx nx serve client
}

build_module() {
    print_header "Building Coproperty Module"
    cd "$FRONTEND_DIR"
    print_info "Running: npx nx build coproperty-module"
    npx nx build coproperty-module
    print_success "Build complete!"
}

run_frontend_tests() {
    print_header "Running Frontend Tests"
    cd "$FRONTEND_DIR"
    print_info "Running: npx nx test coproperty-module"
    npx nx test coproperty-module --watch=false
}

lint_code() {
    print_header "Linting & Formatting Code"
    cd "$FRONTEND_DIR"
    print_info "Running ESLint..."
    npx nx lint coproperty-module --fix || true
    print_success "Linting complete!"
}

start_backend() {
    print_header "Starting Coproperty Backend Service"
    cd "$BACKEND_DIR/Myb.Coproperty"
    print_info "Running: dotnet run"
    print_info "GraphQL endpoint will be available at: http://localhost:8088/graphql"
    dotnet run
}

run_backend_tests() {
    print_header "Running Backend Tests"
    cd "$BACKEND_DIR"
    print_info "Running: dotnet test"
    dotnet test --logger "console;verbosity=normal"
}

create_migration() {
    print_header "Create Database Migration"
    echo -n "Enter migration name: "
    read migration_name
    if [ -z "$migration_name" ]; then
        print_error "Migration name cannot be empty"
        return
    fi
    cd "$BACKEND_DIR/Myb.Coproperty"
    print_info "Creating migration: $migration_name"
    dotnet ef migrations add "$migration_name" --output-dir Infrastructure/Data/Migrations
    print_success "Migration created!"
}

apply_migration() {
    print_header "Apply Database Migration"
    cd "$BACKEND_DIR/Myb.Coproperty"
    print_info "Applying migrations..."
    dotnet ef database update
    print_success "Migrations applied!"
}

open_graphql() {
    print_header "Opening GraphQL Playground"
    print_info "Opening: http://localhost:8088/graphql"
    if command -v open &> /dev/null; then
        open "http://localhost:8088/graphql"
    else
        print_info "Please open http://localhost:8088/graphql in your browser"
    fi
}

check_status() {
    print_header "Service Status Check"
    
    echo ""
    print_info "Checking Frontend (port 4200)..."
    if curl -s http://localhost:4200 > /dev/null 2>&1; then
        print_success "Frontend is running"
    else
        print_error "Frontend is not running"
    fi
    
    echo ""
    print_info "Checking Coproperty Service (port 8088)..."
    if curl -s http://localhost:8088/health > /dev/null 2>&1; then
        print_success "Coproperty service is running"
    else
        print_error "Coproperty service is not running"
    fi
    
    echo ""
    print_info "Checking Keycloak (port 8080)..."
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        print_success "Keycloak is running"
    else
        print_error "Keycloak is not running"
    fi
    
    echo ""
}

install_deps() {
    print_header "Installing Dependencies"
    
    print_info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    
    print_info "Restoring backend dependencies..."
    cd "$BACKEND_DIR/Myb.Coproperty"
    dotnet restore
    
    print_success "All dependencies installed!"
}

clean_rebuild() {
    print_header "Clean & Rebuild All"
    
    print_info "Cleaning frontend..."
    cd "$FRONTEND_DIR"
    rm -rf node_modules/.cache
    rm -rf dist
    
    print_info "Installing frontend dependencies..."
    npm install
    
    print_info "Building coproperty module..."
    npx nx build coproperty-module
    
    print_info "Cleaning backend..."
    cd "$BACKEND_DIR/Myb.Coproperty"
    dotnet clean
    
    print_info "Building backend..."
    dotnet build
    
    print_success "Clean rebuild complete!"
}

view_progress() {
    print_header "Coproperty Progress Report"
    if [ -f "$DOCS_DIR/COPROPERTY_PROGRESS_REPORT.md" ]; then
        cat "$DOCS_DIR/COPROPERTY_PROGRESS_REPORT.md" | less
    else
        print_error "Progress report not found"
    fi
}

view_owner_portal() {
    print_header "Owner Portal Implementation Guide"
    if [ -f "$DOCS_DIR/OWNER_PORTAL_IMPLEMENTATION.md" ]; then
        cat "$DOCS_DIR/OWNER_PORTAL_IMPLEMENTATION.md" | less
    else
        print_error "Owner portal guide not found"
    fi
}

view_implementation() {
    print_header "Complete Implementation Guide"
    if [ -f "$DOCS_DIR/COPROPERTY_COMPLETE_IMPLEMENTATION_GUIDE.md" ]; then
        cat "$DOCS_DIR/COPROPERTY_COMPLETE_IMPLEMENTATION_GUIDE.md" | less
    else
        print_error "Implementation guide not found"
    fi
}

view_quickstart() {
    print_header "Owner Portal Quick Start"
    if [ -f "$DOCS_DIR/OWNER_PORTAL_QUICKSTART.md" ]; then
        cat "$DOCS_DIR/OWNER_PORTAL_QUICKSTART.md" | less
    else
        print_error "Quick start guide not found"
    fi
}

test_routes() {
    print_header "Testing Owner Portal Routes"
    
    print_info "Testing routes in frontend..."
    cd "$FRONTEND_DIR"
    
    echo ""
    print_info "Owner Portal Route: /coproperty/owner"
    print_info "Admin Dashboard Route: /coproperty"
    echo ""
    
    print_info "Checking if routes are configured..."
    if grep -q "owner-portal" "libs/coproperty-module/src/lib/components/coproperty.routes.ts"; then
        print_success "Owner portal route is configured"
    else
        print_error "Owner portal route not found"
    fi
    
    echo ""
    print_info "Starting dev server to test routes..."
    print_info "Once started, navigate to:"
    print_info "  - http://localhost:4200/coproperty (Admin Dashboard)"
    print_info "  - http://localhost:4200/coproperty/owner (Owner Portal)"
    echo ""
    read -p "Press Enter to continue..."
}

generate_test_data() {
    print_header "Generate Test Data"
    
    print_info "This will open GraphQL Playground with sample mutations"
    print_info "You can use these to create test data for development"
    echo ""
    
    cat << 'EOF'
Sample GraphQL Mutations for Test Data:

# 1. Create a coproperty
mutation {
  createCoproperty(input: {
    name: "Test Building"
    address: "123 Main Street"
    city: "Paris"
    postalCode: "75001"
    country: "France"
    totalUnits: 10
    totalShares: 1000
    managerId: "YOUR_USER_ID"
  }) {
    id
    name
  }
}

# 2. Create a unit
mutation {
  createUnit(unit: {
    copropertyId: "COPROPERTY_ID"
    unitNumber: "A101"
    floor: 1
    area: 75.5
    shares: 100
  }) {
    id
    unitNumber
  }
}

# 3. Create an owner
mutation {
  createOwner(owner: {
    userId: "YOUR_USER_ID"
    unitId: "UNIT_ID"
    ownershipPercentage: 100
    startDate: "2026-01-01"
    isMainOwner: true
  }) {
    id
  }
}

# 4. Create a charge
mutation {
  createCharge(charge: {
    copropertyId: "COPROPERTY_ID"
    name: "Monthly Maintenance"
    chargeType: MAINTENANCE
    frequency: MONTHLY
    totalAmount: 150.00
    distributionMethod: BY_SHARES
    startDate: "2026-01-01"
    createdBy: "YOUR_USER_ID"
  }) {
    id
  }
}

# 5. Distribute charge
mutation {
  distributeCharge(chargeId: "CHARGE_ID") {
    unitId
    amount
  }
}

# 6. Generate invoices
mutation {
  generateInvoicesFromCharge(chargeId: "CHARGE_ID") {
    id
    invoiceNumber
    totalAmount
    dueDate
  }
}

EOF
    
    echo ""
    read -p "Press Enter to open GraphQL Playground..."
    open_graphql
}

check_installation() {
    print_header "Installation Status Check"
    
    echo ""
    print_info "Checking Node.js..."
    if command -v node &> /dev/null; then
        print_success "Node.js $(node -v) installed"
    else
        print_error "Node.js not found"
    fi
    
    print_info "Checking npm..."
    if command -v npm &> /dev/null; then
        print_success "npm $(npm -v) installed"
    else
        print_error "npm not found"
    fi
    
    print_info "Checking .NET..."
    if command -v dotnet &> /dev/null; then
        print_success ".NET $(dotnet --version) installed"
    else
        print_error ".NET not found"
    fi
    
    echo ""
    print_info "Checking key npm packages..."
    cd "$FRONTEND_DIR"
    
    if npm list chart.js &> /dev/null; then
        print_success "chart.js installed"
    else
        print_error "chart.js not found"
    fi
    
    if npm list @angular/core &> /dev/null; then
        print_success "Angular installed"
    else
        print_error "Angular not found"
    fi
    
    if npm list apollo-angular &> /dev/null; then
        print_success "Apollo Angular installed"
    else
        print_error "Apollo Angular not found"
    fi
    
    echo ""
    print_info "Checking file structure..."
    
    if [ -f "$FRONTEND_DIR/libs/coproperty-module/src/lib/components/owner-portal/owner-dashboard.component.ts" ]; then
        print_success "Owner dashboard component exists"
    else
        print_error "Owner dashboard component not found"
    fi
    
    if [ -f "$FRONTEND_DIR/libs/coproperty-module/src/lib/services/owner.service.ts" ]; then
        print_success "Owner service exists"
    else
        print_error "Owner service not found"
    fi
    
    if [ -f "$BACKEND_DIR/Myb.Coproperty/GraphQL/Mutations/CopropertyMutations.cs" ]; then
        print_success "Backend mutations exist"
    else
        print_error "Backend mutations not found"
    fi
    
    echo ""
}

# Main loop
while true; do
    show_menu
    read choice
    
    case $choice in
        1) start_admin_app ;;
        2) start_client_app ;;
        3) build_module ;;
        4) run_frontend_tests ;;
        5) lint_code ;;
        6) start_backend ;;
        7) run_backend_tests ;;
        8) create_migration ;;
        9) apply_migration ;;
        10) open_graphql ;;
        11) check_status ;;
        12) install_deps ;;
        13) clean_rebuild ;;
        14) view_progress ;;
        15) view_owner_portal ;;
        16) view_implementation ;;
        17) view_quickstart ;;
        18) test_routes ;;
        19) generate_test_data ;;
        20) check_installation ;;
        0) 
            print_success "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
