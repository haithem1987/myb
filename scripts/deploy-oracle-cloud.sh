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
║   MYB - Oracle Cloud Deployment Automation       ║
║   Full Stack Microservices Deployment            ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running on Oracle Cloud VM
if [ "$1" != "--local" ]; then
    info "This script will set up your MYB project on Oracle Cloud VM"
    info "Make sure you're running this ON the Oracle Cloud VM instance"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# ==============================================================================
# STEP 1: System Update and Dependencies
# ==============================================================================
step "Step 1/7: Updating system and installing dependencies..."

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    nginx \
    postgresql-client

success "System updated and dependencies installed"

# ==============================================================================
# STEP 2: Install Docker
# ==============================================================================
step "Step 2/7: Installing Docker..."

# Remove old versions
sudo apt-get remove -y docker docker-engine docker.io containerd runc || true

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

success "Docker installed successfully"

# ==============================================================================
# STEP 3: Install .NET 10 SDK
# ==============================================================================
step "Step 3/7: Installing .NET 10 SDK..."

# Download Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Install .NET SDK
sudo apt-get update
sudo apt-get install -y dotnet-sdk-9.0

success ".NET SDK installed successfully"

# ==============================================================================
# STEP 4: Install Node.js and Angular CLI
# ==============================================================================
step "Step 4/7: Installing Node.js and Angular CLI..."

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Angular CLI and NX globally
sudo npm install -g @angular/cli@21 nx

success "Node.js and Angular CLI installed"

# ==============================================================================
# STEP 5: Configure Firewall
# ==============================================================================
step "Step 5/7: Configuring firewall..."

# Enable UFW
sudo ufw --force enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports
sudo ufw allow 4200/tcp  # Frontend
sudo ufw allow 8080/tcp  # Keycloak
sudo ufw allow 5001:5006/tcp  # Backend services

success "Firewall configured"

# ==============================================================================
# STEP 6: Clone Repository
# ==============================================================================
step "Step 6/7: Setting up project directory..."

PROJECT_DIR="/home/$USER/myb"
if [ -d "$PROJECT_DIR" ]; then
    info "Project directory already exists at $PROJECT_DIR"
    read -p "Remove and re-clone? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_DIR"
    else
        info "Skipping clone, using existing directory"
    fi
fi

if [ ! -d "$PROJECT_DIR" ]; then
    info "Please enter your Git repository URL:"
    read -p "Repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        error "Repository URL is required"
    fi
    
    git clone "$REPO_URL" "$PROJECT_DIR"
    success "Repository cloned to $PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# ==============================================================================
# STEP 7: Configure Production Environment
# ==============================================================================
step "Step 7/7: Configuring production environment..."

# Create production environment file
cat > .env.production <<EOF
# Production Environment Configuration
# Generated: $(date)

# Frontend
FRONTEND_URL=http://$(curl -s ifconfig.me):4200
ADMIN_URL=http://$(curl -s ifconfig.me):4200

# Keycloak
KEYCLOAK_URL=http://$(curl -s ifconfig.me):8080
KEYCLOAK_REALM=myb
KEYCLOAK_CLIENT_ID=myb-client
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32)

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=myb_admin
DB_PASSWORD=$(openssl rand -base64 32)

# Services
USER_SERVICE_PORT=5001
DOCUMENT_SERVICE_PORT=5002
INVOICE_SERVICE_PORT=5003
TIMESHEET_SERVICE_PORT=5004
PAYMENT_SERVICE_PORT=5005
NOTIFICATION_SERVICE_PORT=5006

# CORS Origins
CORS_ORIGINS=http://$(curl -s ifconfig.me):4200,http://localhost:4200

# JWT Settings
JWT_SECRET=$(openssl rand -base64 64)
JWT_ISSUER=http://$(curl -s ifconfig.me):8080/realms/myb
JWT_AUDIENCE=myb-client

# Environment
ASPNETCORE_ENVIRONMENT=Production
NODE_ENV=production
EOF

success "Production environment configured"

# ==============================================================================
# Final Instructions
# ==============================================================================
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Installation Complete! 🎉                ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
info "IMPORTANT: Log out and log back in for Docker group changes to take effect"
echo ""
info "Next Steps:"
echo "  1. Review and update .env.production with your settings"
echo "  2. Run: ./scripts/build-production.sh"
echo "  3. Run: ./scripts/start-production.sh"
echo ""
info "Your public IP: $(curl -s ifconfig.me)"
echo ""
success "Setup completed successfully!"
