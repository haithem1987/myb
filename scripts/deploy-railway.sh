#!/bin/bash

# ====================================
# MYB Railway Deployment Script
# ====================================
# This script helps deploy myb-coproperty backend
# and myb-admin frontend to Railway
# ====================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    MYB Railway Deployment Script              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
    echo -e "${GREEN}✓ Railway CLI installed${NC}"
else
    echo -e "${GREEN}✓ Railway CLI found${NC}"
fi

# Check if logged in to Railway
echo ""
echo -e "${YELLOW}Logging into Railway...${NC}"
railway login

echo ""
echo -e "${GREEN}✓ Logged into Railway${NC}"
echo ""

# Display important information
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}IMPORTANT: Manual Configuration Required${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Railway deployment requires manual service setup via the dashboard.${NC}"
echo ""
echo -e "${GREEN}This script will:${NC}"
echo -e "  1. Link your local project to Railway"
echo -e "  2. Open the Railway dashboard"
echo -e "  3. Guide you through manual service creation"
echo ""
echo -e "${YELLOW}You MUST manually create 5 services in Railway Dashboard:${NC}"
echo ""
echo -e "  ${BLUE}1. keycloak-db${NC}       (PostgreSQL Database)"
echo -e "  ${BLUE}2. coproperty-db${NC}     (PostgreSQL Database)"
echo -e "  ${BLUE}3. keycloak${NC}          (Authentication Service)"
echo -e "  ${BLUE}4. myb-coproperty${NC}    (Backend API)"
echo -e "  ${BLUE}5. myb-admin${NC}         (Admin Frontend)"
echo ""

# Ask for confirmation
read -p "$(echo -e ${YELLOW}"Continue? (y/n): "${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Opening Railway dashboard...${NC}"
echo ""

# Open Railway dashboard
railway open

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Follow These Steps in Railway Dashboard   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Create Databases First${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}A) Create keycloak-db:${NC}"
echo -e "   1. Click '+ New' → 'Database' → 'PostgreSQL'"
echo -e "   2. Name it: ${GREEN}keycloak-db${NC}"
echo -e "   3. In Variables tab, add:"
echo -e "      ${BLUE}POSTGRES_DB=keycloak${NC}"
echo -e "      ${BLUE}POSTGRES_USER=keycloak${NC}"
echo -e "      ${BLUE}POSTGRES_PASSWORD=<your-secure-password>${NC}"
echo ""
echo -e "${YELLOW}B) Create coproperty-db:${NC}"
echo -e "   1. Click '+ New' → 'Database' → 'PostgreSQL'"
echo -e "   2. Name it: ${GREEN}coproperty-db${NC}"
echo -e "   3. In Variables tab, add:"
echo -e "      ${BLUE}POSTGRES_DB=copropertyDB${NC}"
echo -e "      ${BLUE}POSTGRES_USER=postgres${NC}"
echo -e "      ${BLUE}POSTGRES_PASSWORD=<your-secure-password>${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Deploy Keycloak${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   1. Click '+ New' → 'Empty Service'"
echo -e "   2. Name it: ${GREEN}keycloak${NC}"
echo -e "   3. Settings → Deploy:"
echo -e "      Image: ${BLUE}quay.io/keycloak/keycloak:23.0.4${NC}"
echo -e "      Start Command: ${BLUE}start --db=postgres${NC}"
echo ""
echo -e "   4. In Variables tab, add ALL these:"
echo -e "      ${BLUE}KC_BOOTSTRAP_ADMIN_USERNAME=admin${NC}"
echo -e "      ${BLUE}KC_BOOTSTRAP_ADMIN_PASSWORD=<your-admin-password>${NC}"
echo -e "      ${BLUE}KC_DB=postgres${NC}"
echo -e "      ${BLUE}KC_DB_URL=jdbc:postgresql://\${{keycloak-db.RAILWAY_PRIVATE_DOMAIN}}:5432/keycloak${NC}"
echo -e "      ${BLUE}KC_DB_USERNAME=keycloak${NC}"
echo -e "      ${BLUE}KC_DB_PASSWORD=<same-as-keycloak-db-password>${NC}"
echo -e "      ${BLUE}KEYCLOAK_ADMIN=admin${NC}"
echo -e "      ${BLUE}KEYCLOAK_ADMIN_PASSWORD=<same-as-bootstrap-password>${NC}"
echo -e "      ${BLUE}KC_HOSTNAME_STRICT=false${NC}"
echo -e "      ${BLUE}KC_HTTP_ENABLED=true${NC}"
echo -e "      ${BLUE}KC_PROXY=edge${NC}"
echo -e "      ${BLUE}KC_HOSTNAME_STRICT_HTTPS=false${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Deploy Coproperty Backend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   1. Click '+ New' → 'GitHub Repo'"
echo -e "   2. Select your ${GREEN}myb${NC} repository"
echo -e "   3. Name it: ${GREEN}myb-coproperty${NC}"
echo -e "   4. Settings → Build:"
echo -e "      Root Directory: ${BLUE}/${NC}"
echo -e "      Dockerfile Path: ${BLUE}src/services/coproperty-management/Myb.Coproperty/Dockerfile${NC}"
echo ""
echo -e "   5. In Variables tab, add:"
echo -e "      ${BLUE}ASPNETCORE_ENVIRONMENT=Production${NC}"
echo -e "      ${BLUE}ASPNETCORE_URLS=http://+:8080${NC}"
echo -e "      ${BLUE}ConnectionStrings__CopropertyDBConnection=Host=\${{coproperty-db.RAILWAY_PRIVATE_DOMAIN}};Port=5432;Database=copropertyDB;Username=postgres;Password=<your-db-password>${NC}"
echo -e "      ${BLUE}Keycloak__Authority=https://\${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB${NC}"
echo -e "      ${BLUE}Keycloak__BaseUrl=https://\${{keycloak.RAILWAY_PUBLIC_DOMAIN}}/realms/MYB/protocol/openid-connect${NC}"
echo -e "      ${BLUE}Keycloak__ClientId=MYB-client${NC}"
echo -e "      ${BLUE}Keycloak__ClientSecret=f4umyKKCMYgaipA3f3MndHeTg8ubvyD2${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Deploy Admin Frontend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   1. Click '+ New' → 'GitHub Repo'"
echo -e "   2. Select your ${GREEN}myb${NC} repository"
echo -e "   3. Name it: ${GREEN}myb-admin${NC}"
echo -e "   4. Settings → Build:"
echo -e "      Root Directory: ${BLUE}/${NC}"
echo -e "      Dockerfile Path: ${RED}Dockerfile.frontend${NC} ${YELLOW}← CRITICAL!${NC}"
echo ""
echo -e "   5. In Variables tab, add:"
echo -e "      ${BLUE}NODE_ENV=production${NC}"
echo -e "      ${BLUE}PORT=8080${NC}"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}After Creating All Services:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${YELLOW}1.${NC} Wait for all deployments to complete (5-10 minutes)"
echo -e "   ${YELLOW}2.${NC} Check logs for each service"
echo -e "   ${YELLOW}3.${NC} Test health endpoints:"
echo -e "      - Admin: ${BLUE}https://myb-admin-production.up.railway.app/health${NC}"
echo -e "      - Backend: ${BLUE}https://myb-coproperty-production.up.railway.app/health${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Documentation:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${GREEN}Full Guide:${NC}       docs/RAILWAY_DEPLOYMENT_GUIDE.md"
echo -e "   ${GREEN}502 Fix:${NC}          docs/RAILWAY_502_FIX.md"
echo -e "   ${GREEN}Quick Reference:${NC}  docs/RAILWAY_QUICK_REFERENCE.md"
echo -e "   ${GREEN}Env Variables:${NC}    .env.railway.example"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Script completed! Follow the steps above in Railway Dashboard.${NC}"
echo ""
