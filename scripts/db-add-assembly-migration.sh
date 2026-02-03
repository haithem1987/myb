#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Coproperty Assembly Migration Script  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

SERVICE_NAME="Myb.Coproperty"
MIGRATION_NAME="AddAssemblyTables"

echo -e "${YELLOW}Creating migration for Assembly and AssemblyAttendance tables...${NC}"

cd /Volumes/NidhalSSD/Projects/myb/src/services/coproperty-management/$SERVICE_NAME

# Create migration
dotnet ef migrations add $MIGRATION_NAME \
    --output-dir Infrastructure/Migrations

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration created successfully!${NC}"
    echo ""
    echo -e "${YELLOW}To apply the migration, run:${NC}"
    echo -e "  ${GREEN}./scripts/db-update-coproperty.sh${NC}"
    echo ""
    echo -e "${YELLOW}Or manually:${NC}"
    echo -e "  cd src/services/coproperty-management/$SERVICE_NAME"
    echo -e "  dotnet ef database update"
else
    echo -e "${RED}❌ Migration creation failed!${NC}"
    exit 1
fi
