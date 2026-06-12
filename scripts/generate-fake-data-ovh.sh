#!/bin/bash
# MYB Platform: Generate Fake Test Data on OVH Database
# Connects to OVH PostgreSQL and inserts realistic test data

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MYB OVH Database - Fake Data Generator${NC}"
echo -e "${GREEN}========================================${NC}"

# OVH Database Configuration
PGHOST="postgresql-72268bd4-oc862fcb1.database.cloud.ovh.net"
PGPORT="20184"
PGUSER="coproperty_user"
PGPASSWORD="fSC2TpHJnlya18re3D0B"
PGDATABASE="copropertyDB"
PGSSLMODE="require"

echo -e "\n${YELLOW}Connecting to OVH Database...${NC}"
echo "Host: $PGHOST"
echo "Port: $PGPORT"
echo "User: $PGUSER"
echo "Database: $PGDATABASE"
echo "SSL Mode: $PGSSLMODE"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Path to the SQL script
SQL_SCRIPT="$SCRIPT_DIR/generate-fake-data.sql"

if [ ! -f "$SQL_SCRIPT" ]; then
    echo -e "${RED}✗ SQL script not found: $SQL_SCRIPT${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Executing SQL script on OVH database...${NC}"

# Execute the SQL script with SSL connection
PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    -v sslmode=$PGSSLMODE \
    -f "$SQL_SCRIPT"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Fake data generated successfully on OVH!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\n${YELLOW}Generated Data Summary:${NC}"
    echo "  - 4 Coproperties"
    echo "  - 6 Owners"
    echo "  - 14 Units (Apartments & Villas)"
    echo "  - 6 Charges (Maintenance & Special)"
    echo "  - 7 Charge Distributions"
    echo "  - 5 Fund Calls (Appels de Fonds)"
    echo "  - 3 Fund Call Payments"
    echo ""
    echo -e "${YELLOW}Test Accounts Ready:${NC}"
    echo "  Owner 1: Haithem Khalifa (haithem.khalifa@example.com)"
    echo "  Owner 2: Fatima Ben Ali (fatima.benali@example.com)"
    echo "  Owner 3: Mohamed Triki (mohamed.triki@example.com)"
    echo "  Owner 4: Amina Mabrouk (amina.mabrouk@example.com)"
    echo "  Owner 5: Karim Salah (karim.salah@example.com)"
    echo "  Owner 6: Leila Zahra (leila.zahra@example.com)"
    echo ""
    echo -e "${YELLOW}You can now:${NC}"
    echo "  1. Login to the platform with test accounts"
    echo "  2. Test payment submissions"
    echo "  3. Test syndic approval workflow"
    exit 0
else
    echo -e "${RED}✗ Failed to generate fake data on OVH database${NC}"
    exit 1
fi
