#!/bin/bash
# MYB Platform: Generate Fake Test Data
# Inserts realistic test data into the database for development and testing

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MYB Platform - Fake Data Generator${NC}"
echo -e "${GREEN}========================================${NC}"

# Check for database connection parameters
if [ -z "$DATABASE_CONNECTION" ] && [ -z "$PGHOST" ]; then
    echo -e "${YELLOW}Database configuration not found.${NC}"
    echo "Please set DATABASE_CONNECTION or PostgreSQL environment variables:"
    echo "  - PGHOST (default: localhost)"
    echo "  - PGPORT (default: 5432)"
    echo "  - PGUSER (default: postgres)"
    echo "  - PGPASSWORD"
    echo "  - PGDATABASE"
    exit 1
fi

# Extract connection string or use env vars
if [ -n "$DATABASE_CONNECTION" ]; then
    # Parse connection string: Host=localhost;Port=5432;Username=postgres;Password=xxxx;Database=myb
    PGHOST=$(echo $DATABASE_CONNECTION | grep -oP 'Host=\K[^;]+' || echo "localhost")
    PGPORT=$(echo $DATABASE_CONNECTION | grep -oP 'Port=\K[^;]+' || echo "5432")
    PGUSER=$(echo $DATABASE_CONNECTION | grep -oP 'Username=\K[^;]+' || echo "postgres")
    PGPASSWORD=$(echo $DATABASE_CONNECTION | grep -oP 'Password=\K[^;]+' || echo "")
    PGDATABASE=$(echo $DATABASE_CONNECTION | grep -oP 'Database=\K[^;]+' || echo "myb")
fi

# Set defaults
PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5432}
PGUSER=${PGUSER:-postgres}
PGDATABASE=${PGDATABASE:-myb}

echo -e "\n${YELLOW}Connecting to database...${NC}"
echo "Host: $PGHOST"
echo "Port: $PGPORT"
echo "User: $PGUSER"
echo "Database: $PGDATABASE"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Path to the SQL script
SQL_SCRIPT="$SCRIPT_DIR/generate-fake-data.sql"

if [ ! -f "$SQL_SCRIPT" ]; then
    echo -e "${RED}✗ SQL script not found: $SQL_SCRIPT${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Executing SQL script...${NC}"

# Execute the SQL script
if [ -n "$PGPASSWORD" ]; then
    PGPASSWORD="$PGPASSWORD" psql \
        -h "$PGHOST" \
        -p "$PGPORT" \
        -U "$PGUSER" \
        -d "$PGDATABASE" \
        -f "$SQL_SCRIPT"
else
    psql \
        -h "$PGHOST" \
        -p "$PGPORT" \
        -U "$PGUSER" \
        -d "$PGDATABASE" \
        -f "$SQL_SCRIPT"
fi

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Fake data generated successfully!${NC}"
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
    echo -e "${YELLOW}Test Accounts:${NC}"
    echo "  Owner 1: Haithem Khalifa (haithem.khalifa@example.com)"
    echo "  Owner 2: Fatima Ben Ali (fatima.benali@example.com)"
    echo "  Owner 3: Mohamed Triki (mohamed.triki@example.com)"
    echo "  Owner 4: Amina Mabrouk (amina.mabrouk@example.com)"
    echo "  Owner 5: Karim Salah (karim.salah@example.com)"
    echo "  Owner 6: Leila Zahra (leila.zahra@example.com)"
    exit 0
else
    echo -e "${RED}✗ Failed to generate fake data${NC}"
    exit 1
fi
