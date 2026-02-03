#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Update Coproperty Database Schema   ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

SERVICE_NAME="Myb.Coproperty"

echo -e "${YELLOW}Applying pending migrations to Coproperty database...${NC}"

cd /Volumes/NidhalSSD/Projects/myb/src/services/coproperty-management/$SERVICE_NAME

# Update database
dotnet ef database update

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database updated successfully!${NC}"
    echo ""
    echo -e "${YELLOW}New tables added:${NC}"
    echo -e "  - Assemblies"
    echo -e "  - AssemblyAttendances"
else
    echo -e "${RED}❌ Database update failed!${NC}"
    exit 1
fi
