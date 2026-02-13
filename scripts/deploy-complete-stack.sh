#!/bin/bash

# Complete Stack Deployment to Railway
# Deploys: Backend, Admin, Client, Databases, Keycloak

set -e

echo "🚀 Deploying Complete MYB Stack to Railway..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Please install it first:${NC}"
    echo "   npm i -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged into Railway. Please run: railway login${NC}"
    exit 1
fi

PROJECT_ID="5602a096-5dec-4261-92b8-ad472934679e"

echo -e "${YELLOW}📋 Services to Deploy:${NC}"
echo "  1. ✅ myb-syndic (Backend API)"
echo "  2. ✅ myb-admin (Admin Frontend)"
echo "  3. ⏳ myb-client (Client Frontend)"
echo "  4. ⏳ coproperty-db (PostgreSQL)"
echo "  5. ⏳ keycloak-db (PostgreSQL)"
echo "  6. ⏳ keycloak (Keycloak Auth)"
echo ""

echo -e "${GREEN}Step 1: Create Databases in Railway Dashboard${NC}"
echo "================================================"
echo ""
echo "Please go to Railway Dashboard and add these services:"
echo ""
echo "  1. Go to: https://railway.com/project/${PROJECT_ID}"
echo "  2. Click '+ New' → 'Database' → 'Add PostgreSQL'"
echo "  3. Name it: 'coproperty-db'"
echo "  4. Click '+ New' → 'Database' → 'Add PostgreSQL' again"
echo "  5. Name it: 'keycloak-db'"
echo ""
read -p "Press Enter when databases are created..."

echo ""
echo -e "${GREEN}Step 2: Deploy Client Frontend${NC}"
echo "================================"
railway service link myb-client || {
    echo "Creating myb-client service..."
    echo "Please create 'myb-client' service in Railway Dashboard, then press Enter"
    read -p ""
    railway service link myb-client
}

echo "Deploying client frontend..."
RAILWAY_DOCKERFILE_PATH=Dockerfile.client railway up --detach

echo ""
echo -e "${GREEN}Step 3: Deploy Keycloak${NC}"
echo "========================"
echo ""
echo "For Keycloak, you need to:"
echo "  1. In Railway Dashboard, click '+ New' → 'Empty Service'"
echo "  2. Name it: 'keycloak'"
echo "  3. Go to Settings → Image and set:"
echo "     Image: quay.io/keycloak/keycloak:23.0.4"
echo "  4. Go to Variables and add:"
echo "     KEYCLOAK_ADMIN=admin"
echo "     KEYCLOAK_ADMIN_PASSWORD=<your-password>"
echo "     KC_DB=postgres"
echo "     KC_DB_URL=<copy from keycloak-db DATABASE_URL>"
echo "     KC_DB_USERNAME=postgres"
echo "     KC_DB_PASSWORD=<from keycloak-db>"
echo "     KC_HOSTNAME_STRICT=false"
echo "     KC_HTTP_ENABLED=true"
echo "  5. Start Command: start --optimized"
echo ""
read -p "Press Enter when Keycloak is configured..."

echo ""
echo -e "${GREEN}Step 4: Update Backend Environment Variables${NC}"
echo "=============================================="
railway service link myb-syndic

echo "Setting backend environment variables..."
echo "You need to update these in Railway Dashboard → myb-syndic → Variables:"
echo ""
echo "  ConnectionStrings__CopropertyDb=<copy from coproperty-db DATABASE_URL>"
echo "  ASPNETCORE_ENVIRONMENT=Production"
echo ""
read -p "Press Enter when backend variables are updated..."

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "======================="
echo ""
echo "📊 Your Services:"
echo "  • Backend API: https://myb-syndic-production.up.railway.app"
echo "  • Admin Panel: https://myb-admin-production.up.railway.app"
echo "  • Client Portal: https://myb-client-production.up.railway.app"
echo "  • Keycloak: https://keycloak-production.up.railway.app"
echo ""
echo "🔗 Generate domains for each service in Railway Dashboard → Settings → Networking"
echo ""
echo "✨ Share the Admin Panel URL with your boss!"
