#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 PostgreSQL Database Repair Script${NC}"
echo "======================================="

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Stopping containers...${NC}"
docker-compose down

echo -e "${YELLOW}2. Removing corrupted PostgreSQL volumes...${NC}"
docker volume rm myb_keycloak_db_data 2>/dev/null || true
docker volume rm myb_postgres_data 2>/dev/null || true

# Remove any leftover postgres volumes
docker volume ls | grep postgres | awk '{print $2}' | xargs -r docker volume rm

echo -e "${YELLOW}3. Cleaning up docker system...${NC}"
docker system prune -f

echo -e "${YELLOW}4. Restarting PostgreSQL container...${NC}"
docker-compose up -d keycloak-db

echo -e "${YELLOW}5. Waiting for PostgreSQL to initialize...${NC}"
sleep 10

# Check if container is healthy
if docker-compose ps keycloak-db | grep -q "Up"; then
    echo -e "${GREEN}✅ PostgreSQL started successfully${NC}"
    echo ""
    echo -e "${YELLOW}6. Checking database status...${NC}"
    docker-compose logs keycloak-db | tail -20
    echo ""
    echo -e "${GREEN}✅ Database repair complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start remaining services: docker-compose up -d"
    echo "2. Check service health: docker-compose ps"
    echo "3. View logs if needed: docker-compose logs -f"
else
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    docker-compose logs keycloak-db
    exit 1
fi
