#!/bin/bash

# MYB Coproperty Management - Development Helper Script
# This script helps you navigate and work on the coproperty module

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
BACKEND_PATH="src/services/coproperty-management/Myb.Coproperty"
FRONTEND_PATH="src/front/myb.front/libs/coproperty-module"
DOCS_PATH="docs"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MYB Coproperty Management Helper${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

function show_menu() {
    echo -e "${GREEN}Select an action:${NC}"
    echo "1. Show implementation status"
    echo "2. Open backend service folder"
    echo "3. Open frontend module folder"
    echo "4. Run backend tests"
    echo "5. Run frontend dev server"
    echo "6. View TODO list"
    echo "7. Generate new component"
    echo "8. Generate new service"
    echo "9. View documentation"
    echo "0. Exit"
    echo ""
    read -p "Enter choice: " choice
    
    case $choice in
        1) show_status ;;
        2) open_backend ;;
        3) open_frontend ;;
        4) run_backend_tests ;;
        5) run_frontend_dev ;;
        6) view_todos ;;
        7) generate_component ;;
        8) generate_service ;;
        9) view_docs ;;
        0) exit 0 ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
}

function show_status() {
    echo -e "${YELLOW}=== Implementation Status ===${NC}"
    echo ""
    echo -e "${GREEN}✅ COMPLETED:${NC}"
    echo "  - Coproperty CRUD (create, update, delete, get)"
    echo "  - Charge distribution algorithms (ByShares, ByArea, Equal)"
    echo "  - Unit, Owner, Charge, FundCall, Maintenance models"
    echo "  - Dashboard stats backend (partial)"
    echo "  - Frontend dashboard component (partial)"
    echo ""
    echo -e "${YELLOW}🔄 IN PROGRESS:${NC}"
    echo "  - Invoice generation from FundCalls (Task 3)"
    echo "  - Payment recording (Task 4)"
    echo "  - Admin dashboard UI completion (Task 7)"
    echo ""
    echo -e "${RED}⏳ TODO (20 tasks total):${NC}"
    echo "  - Invoice generation (backend)"
    echo "  - Payment integration (backend + frontend)"
    echo "  - Maintenance workflow (backend + frontend)"
    echo "  - Owner portal UI (frontend)"
    echo "  - RBAC implementation (backend + frontend)"
    echo "  - Notifications integration"
    echo "  - Document service integration"
    echo "  - Financial reports UI"
    echo "  - Testing (unit + E2E)"
    echo ""
    echo -e "${BLUE}📊 Progress: ~15% complete${NC}"
    echo ""
    read -p "Press enter to continue..."
    show_menu
}

function open_backend() {
    echo -e "${BLUE}Opening backend folder...${NC}"
    cd "$BACKEND_PATH"
    code . 2>/dev/null || echo "Opening $BACKEND_PATH"
    show_menu
}

function open_frontend() {
    echo -e "${BLUE}Opening frontend folder...${NC}"
    cd "$FRONTEND_PATH"
    code . 2>/dev/null || echo "Opening $FRONTEND_PATH"
    show_menu
}

function run_backend_tests() {
    echo -e "${BLUE}Running backend tests...${NC}"
    cd "$BACKEND_PATH"
    dotnet test
    read -p "Press enter to continue..."
    show_menu
}

function run_frontend_dev() {
    echo -e "${BLUE}Starting frontend development server...${NC}"
    cd src/front/myb.front
    npx nx serve client
}

function view_todos() {
    echo -e "${YELLOW}=== Current TODO List ===${NC}"
    echo ""
    echo "See detailed tasks in: docs/COPROPERTY_COMPLETE_IMPLEMENTATION_GUIDE.md"
    echo ""
    echo -e "${GREEN}PRIORITY 1 (Next 5 tasks):${NC}"
    echo "  1. ✅ UpdateCoproperty mutation - DONE"
    echo "  2. ✅ Charge distribution algorithms - DONE"
    echo "  3. 🔄 Invoice generation from FundCalls - IN PROGRESS"
    echo "  4. ⏳ Payment recording & status updates"
    echo "  5. ⏳ Maintenance workflow mutations"
    echo ""
    echo -e "${BLUE}PRIORITY 2 (Admin UI):${NC}"
    echo "  6. ⏳ Fix dashboard stats calculations"
    echo "  7. ⏳ Complete Admin Dashboard UI"
    echo "  8. ⏳ Build Coproperty Detail page"
    echo "  9. ⏳ Build Unit Management UI"
    echo "  10. ⏳ Build Owner Management UI"
    echo ""
    echo -e "${BLUE}PRIORITY 3 (Owner Portal):${NC}"
    echo "  14. ⏳ Build Owner Portal Dashboard"
    echo "  15. ⏳ Build Owner Invoice Payment Flow"
    echo ""
    echo "Total: 20 tasks"
    echo ""
    read -p "Press enter to continue..."
    show_menu
}

function generate_component() {
    echo -e "${BLUE}Generate new Angular component${NC}"
    read -p "Component name (e.g., invoice-list): " name
    cd src/front/myb.front
    npx nx g @nx/angular:component "libs/coproperty-module/src/lib/components/$name" --standalone --style=scss
    echo -e "${GREEN}Component created at: libs/coproperty-module/src/lib/components/$name${NC}"
    read -p "Press enter to continue..."
    show_menu
}

function generate_service() {
    echo -e "${BLUE}Generate new Angular service${NC}"
    read -p "Service name (e.g., invoice): " name
    cd src/front/myb.front
    npx nx g @nx/angular:service "libs/coproperty-module/src/lib/services/$name"
    echo -e "${GREEN}Service created at: libs/coproperty-module/src/lib/services/$name.service.ts${NC}"
    read -p "Press enter to continue..."
    show_menu
}

function view_docs() {
    echo -e "${YELLOW}=== Available Documentation ===${NC}"
    echo ""
    echo "1. COPROPERTY_COMPLETE_IMPLEMENTATION_GUIDE.md - Full implementation guide with all tasks"
    echo "2. COPROPERTY_IMPLEMENTATION_PLAN.md - High-level plan and phases"
    echo "3. COPROPERTY_MANAGEMENT_DOC.md - Technical documentation"
    echo "4. COPROPERTY_MANAGEMENT_SPEC.md - Complete specifications"
    echo ""
    read -p "Enter number to view (or press enter to skip): " doc_choice
    
    case $doc_choice in
        1) cat "$DOCS_PATH/COPROPERTY_COMPLETE_IMPLEMENTATION_GUIDE.md" | less ;;
        2) cat "$DOCS_PATH/COPROPERTY_IMPLEMENTATION_PLAN.md" | less ;;
        3) cat "$DOCS_PATH/COPROPERTY_MANAGEMENT_DOC.md" | less ;;
        4) cat "$DOCS_PATH/COPROPERTY_MANAGEMENT_SPEC.md" | less ;;
        *) ;;
    esac
    
    show_menu
}

# Start
show_menu
