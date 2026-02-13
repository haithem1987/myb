#!/bin/bash

# Railway Deployment Script - Deploy with Docker Compose
set -e

echo "🚀 Deploying MYB Project to Railway"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Ensure we're in the project directory
cd /Volumes/NidhalSSD/Projects/myb

print_info "Building Docker images locally first (to verify)..."
docker-compose -f docker-compose.deploy.yml build --no-cache myb-coproperty
print_status "Backend built successfully"

print_info "Building admin frontend..."
cd src/front/myb.front
npx nx build admin --prod
print_status "Frontend built successfully"

cd /Volumes/NidhalSSD/Projects/myb

print_info "Deploying to Railway..."
railway up --detach

print_status "Deployment initiated!"
echo ""
echo "📊 Monitor deployment:"
echo "   Dashboard: https://railway.com/project/5602a096-5dec-4261-92b8-ad472934679e"
echo ""
echo "🔧 Next steps:"
echo "1. Go to Railway dashboard"
echo "2. Wait for build to complete (~5-10 min)"
echo "3. Click on service → Settings → Generate Domain"
echo "4. Access your app at the generated URL"
echo ""
echo "📝 Don't forget to set environment variables in Railway dashboard:"
echo "   - KEYCLOAK_ADMIN_PASSWORD"
echo "   - COPROPERTY_DB_PASSWORD"
echo "   - KEYCLOAK_DB_PASSWORD"
echo ""
