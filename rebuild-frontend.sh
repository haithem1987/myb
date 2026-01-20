#!/bin/bash

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 MYB Frontend Port Configuration Fix${NC}"
echo "=========================================="
echo ""

# Check if docker is running
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Verifying environment files...${NC}"
if [ -f "src/front/myb.front/apps/client/src/environments/environment.ts" ]; then
    echo -e "${GREEN}✅ environment.ts exists${NC}"
else
    echo -e "${RED}❌ environment.ts not found${NC}"
    exit 1
fi

if [ -f "src/front/myb.front/apps/client/src/environments/environment.prod.ts" ]; then
    echo -e "${GREEN}✅ environment.prod.ts exists${NC}"
else
    echo -e "${RED}❌ environment.prod.ts not found${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 2: Building frontend image...${NC}"
docker compose build --no-cache myb-front

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 3: Starting services...${NC}"
docker compose up -d myb-front

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Services started${NC}"
else
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 4: Verifying services are running...${NC}"
echo ""
docker compose ps

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Frontend rebuild completed!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "Frontend URL: ${GREEN}http://localhost:4200${NC}"
echo -e "Payment Service: ${GREEN}http://localhost:8084${NC}"
echo -e "Document Service: ${GREEN}http://localhost:8086${NC}"
echo -e "Invoice Service: ${GREEN}http://localhost:8083${NC}"
echo -e "Timesheet Service: ${GREEN}http://localhost:8082${NC}"
echo -e "Notification Service: ${GREEN}http://localhost:8085${NC}"
echo -e "Coproperty Service: ${GREEN}http://localhost:8088${NC}"
echo -e "Keycloak: ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "1. Open browser and navigate to http://localhost:4200"
echo "2. Test payment functionality to verify port 8084 is accessible"
echo "3. Check browser console (F12) for any errors"
echo "4. Use 'docker compose logs myb-front' to view frontend logs"
echo "5. Use 'docker compose logs myb-payment' to view payment service logs"
echo ""
