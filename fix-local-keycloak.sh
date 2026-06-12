#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  FIX: Switch from Production to Local Keycloak${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Stop running containers
echo -e "${YELLOW}▶ Stopping all docker containers...${NC}"
docker compose down 2>/dev/null || true
sleep 2

# Step 2: Start backend with dev compose
echo -e "${YELLOW}▶ Starting backend services with docker-compose.dev.yml...${NC}"
docker compose -f docker-compose.dev.yml up -d keycloak keycloak-db
echo -e "${GREEN}✓ Keycloak services starting (waiting 60 seconds for health)...${NC}"
sleep 60

# Step 3: Initialize Keycloak realm and client
echo -e "${YELLOW}▶ Initializing Keycloak realm and client...${NC}"
./scripts/keycloak-setup-roles-users.sh > /dev/null 2>&1 || {
  echo -e "${RED}✗ Keycloak setup failed, but continuing...${NC}"
}

# Step 4: Verify Keycloak is reachable
echo -e "${YELLOW}▶ Verifying Keycloak at http://localhost:8080...${NC}"
if curl -s http://localhost:8080 > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Keycloak is reachable${NC}"
else
  echo -e "${RED}✗ Keycloak not reachable, waiting...${NC}"
  sleep 30
fi

# Step 5: Start backend services needed for frontend
echo -e "${YELLOW}▶ Starting backend services (coproperty, invoice, etc.)...${NC}"
docker compose -f docker-compose.dev.yml up -d \
  keycloak \
  keycloak-db \
  copropertyDB \
  documentDB \
  invoiceDB \
  timesheetDB \
  notificationDB \
  myb-coproperty \
  myb-invoice \
  myb-docmanager \
  myb-timesheet \
  myb-notification \
  myb-usermanager \
  rabbitmq \
  mailhog

echo -e "${GREEN}✓ Backend services started${NC}"
sleep 30

# Step 6: Run frontend locally with dev environment
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  IMPORTANT: Frontend will run LOCALLY (not in Docker)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Starting Angular frontend on http://localhost:4200${NC}"
echo -e "${YELLOW}Frontend will use LOCAL Keycloak at http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the frontend (backend keeps running)${NC}"
echo ""

# Run the dev frontend script
./scripts/dev-local-frontend.sh client

