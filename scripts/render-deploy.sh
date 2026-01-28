#!/bin/bash

# MYB Render Deployment Helper Script
# This script helps configure and deploy MYB to Render

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
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Main menu
show_menu() {
    echo -e "\n${BLUE}=== MYB Render Deployment Helper ===${NC}\n"
    echo "1. Generate environment variables template"
    echo "2. Validate render.yaml syntax"
    echo "3. Check prerequisites"
    echo "4. Display service information"
    echo "5. Create .env.render file for local reference"
    echo "6. Exit"
    echo ""
    read -p "Select option (1-6): " choice
}

# Generate environment variables template
generate_env_template() {
    info "Generating environment variables template..."
    
    cat > .env.render.template <<'EOF'
# ===== KEYCLOAK CONFIGURATION =====
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=CHANGE_ME_SECURE_PASSWORD
KEYCLOAK_HOSTNAME_URL=https://myb-keycloak-XXXX.onrender.com
KEYCLOAK_CLIENT_ID=MYB-client
KEYCLOAK_CLIENT_SECRET=CHANGE_ME_CLIENT_SECRET
KEYCLOAK_URL=https://myb-keycloak-XXXX.onrender.com

# ===== DATABASE PASSWORDS =====
TIMESHEET_DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD
DOCUMENT_DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD
INVOICE_DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD
COPROPERTY_DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# ===== STRIPE CONFIGURATION =====
STRIPE_SECRET_KEY=sk_test_CHANGE_ME_SECRET
STRIPE_PUBLISHABLE_KEY=pk_test_CHANGE_ME_PUBLIC

# ===== SENDGRID CONFIGURATION =====
SENDGRID_API_KEY=SG.CHANGE_ME_API_KEY
EMAIL_FROM_ADDRESS=noreply@myb.com

# ===== FRONTEND CONFIGURATION =====
API_BASE_URL=https://myb-frontend-XXXX.onrender.com
EOF

    success "Environment template created: .env.render.template"
    info "Replace CHANGE_ME values with your actual credentials"
}

# Validate render.yaml
validate_render_yaml() {
    info "Validating render.yaml syntax..."
    
    if [ ! -f "render.yaml" ]; then
        error "render.yaml not found in current directory"
    fi
    
    # Check for YAML syntax using python if available
    if command -v python3 &> /dev/null; then
        python3 << 'PYTHON_SCRIPT'
import yaml
import sys

try:
    with open('render.yaml', 'r') as f:
        yaml.safe_load(f)
    print("✅ render.yaml syntax is valid")
except yaml.YAMLError as e:
    print(f"❌ YAML Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
PYTHON_SCRIPT
    else
        warning "Python3 not available, skipping YAML validation"
        warning "Please validate render.yaml manually"
    fi
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    local all_ok=true
    
    # Check git
    if command -v git &> /dev/null; then
        success "Git: $(git --version)"
    else
        warning "Git not found (required for Render deployment)"
        all_ok=false
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        success "Docker: $(docker --version)"
    else
        warning "Docker not found (required for local testing)"
        all_ok=false
    fi
    
    # Check render.yaml
    if [ -f "render.yaml" ]; then
        success "render.yaml: Found"
    else
        error "render.yaml: Not found in current directory"
    fi
    
    # Check Dockerfile existence
    info "Checking Dockerfiles..."
    local dockerfiles=(
        "src/services/user-manager/Myb.UserManager/Dockerfile"
        "src/services/time-sheet/Myb.Timesheet/Dockerfile"
        "src/services/document-management/Myb.Document/Dockerfile"
        "src/services/invoice-management/Myb.Invoice/Dockerfile"
        "src/services/payment-service/Myb.Payment/Dockerfile"
        "src/services/notification-service/Myb.Notification/Dockerfile"
        "src/services/coproperty-management/Myb.Coproperty/Dockerfile"
        "src/front/myb.front/Dockerfile"
    )
    
    for df in "${dockerfiles[@]}"; do
        if [ -f "$df" ]; then
            echo "  ✅ $df"
        else
            echo "  ❌ $df (MISSING)"
            all_ok=false
        fi
    done
    
    if [ "$all_ok" = true ]; then
        success "All prerequisites met!"
    else
        warning "Some prerequisites are missing"
    fi
}

# Display service information
display_services() {
    info "MYB Render Deployment Services:"
    
    cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════╗
║                        DATABASES (5 PostgreSQL)                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Service          │ Name              │ Port  │ Database Name  │ Region     ║
╠──────────────────┼───────────────────┼───────┼────────────────┼────────────╣
║ Keycloak DB      │ keycloak-db       │ 5432  │ keycloak       │ oregon     ║
║ Timesheet DB     │ timesheet-db      │ 5432  │ timesheetDB    │ oregon     ║
║ Document DB      │ document-db       │ 5432  │ documentDB     │ oregon     ║
║ Invoice DB       │ invoice-db        │ 5432  │ invoiceDB      │ oregon     ║
║ Coproperty DB    │ coproperty-db     │ 5432  │ copropertyDB   │ oregon     ║
╚════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════╗
║                     BACKEND SERVICES (1 + 7 Services)                      ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Service            │ Name               │ Runtime   │ Plan      │ Region   ║
╠────────────────────┼────────────────────┼───────────┼───────────┼──────────╣
║ Keycloak           │ myb-keycloak       │ Docker    │ standard  │ oregon   ║
║ User Manager       │ myb-usermanager    │ Docker    │ standard  │ oregon   ║
║ Timesheet          │ myb-timesheet      │ Docker    │ standard  │ oregon   ║
║ Document Manager   │ myb-docmanager     │ Docker    │ standard  │ oregon   ║
║ Invoice            │ myb-invoice        │ Docker    │ standard  │ oregon   ║
║ Payment            │ myb-payment        │ Docker    │ standard  │ oregon   ║
║ Notification       │ myb-notification   │ Docker    │ standard  │ oregon   ║
║ Coproperty         │ myb-coproperty     │ Docker    │ standard  │ oregon   ║
╚════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════╗
║                      FRONTEND SERVICE (1 Web)                              ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Service    │ Name            │ Runtime   │ Plan      │ Region             ║
╠────────────┼─────────────────┼───────────┼───────────┼────────────────────╣
║ Frontend   │ myb-frontend    │ Docker    │ standard  │ oregon             ║
╚════════════════════════════════════════════════════════════════════════════╝

Total: 13 Services + 5 Databases = 18 Resources

EOF

    info "Total estimated monthly cost on standard plan: ~$50-100 (for production)"
    warning "Free tier: Sufficient for development/staging only"
}

# Create .env.render file
create_env_render() {
    info "Creating .env.render file..."
    
    # Check if template exists
    if [ ! -f ".env.render.template" ]; then
        warning "Template not found, generating first..."
        generate_env_template
    fi
    
    cp .env.render.template .env.render
    
    info "Opening .env.render in editor..."
    info "Please update all CHANGE_ME values with your actual credentials"
    
    if command -v code &> /dev/null; then
        code .env.render
    elif command -v nano &> /dev/null; then
        nano .env.render
    elif command -v vim &> /dev/null; then
        vim .env.render
    else
        warning "No editor found, please edit .env.render manually"
    fi
    
    success ".env.render created (ADD THIS TO .gitignore!)"
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1)
            generate_env_template
            ;;
        2)
            validate_render_yaml
            ;;
        3)
            check_prerequisites
            ;;
        4)
            display_services
            ;;
        5)
            create_env_render
            ;;
        6)
            info "Exiting..."
            exit 0
            ;;
        *)
            error "Invalid option"
            ;;
    esac
done
