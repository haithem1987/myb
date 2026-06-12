#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
#  MYB BUDGET GENERATION SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
# Generates realistic fund calls (budgets) for coproperties based on charges
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_header() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo ""
}

log_step() {
  echo -e "${BLUE}▶${NC} $1..."
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

# ─── Configuration ─────────────────────────────────────────────────────────────

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5433}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-copropertyDB}"

ADMIN_USER_ID="00000000-0000-0000-0000-000000000001"  # Admin user for CreatedBy
CURRENT_YEAR=$(date +%Y)

# ─── Database Connection ───────────────────────────────────────────────────────

setup_database_connection() {
  log_step "Connecting to PostgreSQL: $PGHOST:$PGPORT/$PGDATABASE"

  USE_DOCKER=false
  if ! command -v psql &>/dev/null; then
    if command -v docker &>/dev/null && docker ps >/dev/null 2>&1; then
      USE_DOCKER=true
      log_step "Using Docker to connect to PostgreSQL"
    else
      log_error "Neither psql nor Docker found"
      return 1
    fi
  fi

  # Test connection
  log_step "Testing database connection"
  if [ "$USE_DOCKER" = true ]; then
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep -i "copropertydb" | head -1)
    
    if [ -z "$CONTAINER_NAME" ]; then
      log_error "Cannot find copropertyDB container"
      return 1
    fi
    
    if ! docker exec "$CONTAINER_NAME" psql -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" 2>/dev/null; then
      log_error "Cannot connect to database via Docker"
      return 1
    fi
  else
    export PGPASSWORD="$PGPASSWORD"
    if ! psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" >/dev/null 2>&1; then
      log_error "Cannot connect to database"
      return 1
    fi
  fi

  log_success "Database connection OK"
}

# ─── Budget Generation ─────────────────────────────────────────────────────────

generate_budgets() {
  log_header "BUDGET GENERATION — Creating Fund Calls"

  # Create temporary SQL file
  SQL_FILE="/tmp/myb_budgets_$(date +%s).sql"

  cat > "$SQL_FILE" << 'EOF'
-- ============================================
-- BUDGET GENERATION FOR MYB PLATFORM
-- ============================================

-- 1. ANNUAL BUDGETS (Quarterly fund calls for maintenance charges)
-- Résidence Les Jardins - Maintenance charges: 8500/month = 102,000/year
-- Quarterly: 25,500 per trimester
INSERT INTO "FundCalls" ("Id", "CopropertyId", "Amount", "DueDate", "Description", 
                         "IsActive", "CreatedBy", "Status", "CreatedAt", "UpdatedAt")
VALUES
  -- Q1 2026 - Résidence Les Jardins
  ('f50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
   25500.00, '2026-03-31 23:59:59+00', 'Charges courantes Q1 2026 - Entretien, gardiennage, électricité',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  -- Q2 2026 - Résidence Les Jardins
  ('f50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 
   25500.00, '2026-06-30 23:59:59+00', 'Charges courantes Q2 2026 - Entretien, gardiennage, électricité',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  -- Q3 2026 - Résidence Les Jardins
  ('f50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 
   25500.00, '2026-09-30 23:59:59+00', 'Charges courantes Q3 2026 - Entretien, gardiennage, électricité',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  -- Q4 2026 - Résidence Les Jardins
  ('f50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 
   25500.00, '2026-12-31 23:59:59+00', 'Charges courantes Q4 2026 - Entretien, gardiennage, électricité',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  -- SPECIAL WORKS - Résidence Les Jardins (Façade work)
  ('f50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 
   35000.00, '2026-06-30 23:59:59+00', 'Travaux façade 2026 - Ravalement et peinture extérieure',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  -- Villa Minerve Premium - Maintenance: 6200/month + 2800 pool + 8000 security = 17,000/month = 204,000/year
  -- Quarterly: 51,000 per trimester
  ('f50e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 
   51000.00, '2026-03-31 23:59:59+00', 'Charges exploitation Q1 2026 - Eau, électricité, chauffage, piscine, gardiennage',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  ('f50e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 
   51000.00, '2026-06-30 23:59:59+00', 'Charges exploitation Q2 2026 - Eau, électricité, chauffage, piscine, gardiennage',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  ('f50e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 
   51000.00, '2026-09-30 23:59:59+00', 'Charges exploitation Q3 2026 - Eau, électricité, chauffage, piscine, gardiennage',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  ('f50e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', 
   51000.00, '2026-12-31 23:59:59+00', 'Charges exploitation Q4 2026 - Eau, électricité, chauffage, piscine, gardiennage',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  -- Immeuble Carthage Elite - Maintenance: 9200/month = 110,400/year
  -- Quarterly: 27,600 per trimester
  ('f50e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 
   27600.00, '2026-03-31 23:59:59+00', 'Charges communes Q1 2026 - Ascenseurs, électricité, éclairage',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  ('f50e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 
   27600.00, '2026-06-30 23:59:59+00', 'Charges communes Q2 2026 - Ascenseurs, électricité, éclairage',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  ('f50e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 
   27600.00, '2026-09-30 23:59:59+00', 'Charges communes Q3 2026 - Ascenseurs, électricité, éclairage',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  ('f50e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 
   27600.00, '2026-12-31 23:59:59+00', 'Charges communes Q4 2026 - Ascenseurs, électricité, éclairage',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  -- SPECIAL WORKS - Immeuble Carthage Elite (Elevator replacement)
  ('f50e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 
   65000.00, '2026-09-30 23:59:59+00', 'Remplacement ascenseurs - Modernisation 3 ascenseurs',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  -- SPECIAL WORKS - Immeuble Carthage Elite (Roof waterproofing)
  ('f50e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', 
   18000.00, '2026-07-31 23:59:59+00', 'Étanchéité terrasses - Réparation imperméabilisation',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  -- Complexe Résidentiel Sousse - Maintenance: 5500 + 3000 green spaces = 8,500/month = 102,000/year
  -- Quarterly: 25,500 per trimester
  ('f50e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440004', 
   25500.00, '2026-03-31 23:59:59+00', 'Charges communes Q1 2026 - Électricité, eau, gaz, gardiennage, espaces verts',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  ('f50e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440004', 
   25500.00, '2026-06-30 23:59:59+00', 'Charges communes Q2 2026 - Électricité, eau, gaz, gardiennage, espaces verts',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  ('f50e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440004', 
   25500.00, '2026-09-30 23:59:59+00', 'Charges communes Q3 2026 - Électricité, eau, gaz, gardiennage, espaces verts',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW()),

  ('f50e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440004', 
   25500.00, '2026-12-31 23:59:59+00', 'Charges communes Q4 2026 - Électricité, eau, gaz, gardiennage, espaces verts',
   true, '00000000-0000-0000-0000-000000000001', 'ToPay', NOW(), NOW())

ON CONFLICT DO NOTHING;

-- Show summary
SELECT 'Budget generation complete!' AS status;
SELECT COUNT(*) as "Fund Calls Created" FROM "FundCalls";
EOF

  # Execute SQL
  log_step "Generating budgets for all coproperties"
  
  if [ "$USE_DOCKER" = true ]; then
    if cat "$SQL_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; then
      log_success "Budgets generated successfully"
      rm -f "$SQL_FILE"
    else
      log_error "Failed to generate budgets"
      echo ""
      echo "${YELLOW}Trying again with verbose output:${NC}"
      cat "$SQL_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$PGUSER" -d "$PGDATABASE" 2>&1 | tail -20
      echo ""
      echo "${YELLOW}SQL file saved for inspection:${NC}"
      echo "  $SQL_FILE"
      return 1
    fi
  else
    export PGPASSWORD="$PGPASSWORD"
    if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$SQL_FILE" >/dev/null 2>&1; then
      log_success "Budgets generated successfully"
      rm -f "$SQL_FILE"
    else
      log_error "Failed to generate budgets"
      echo ""
      echo "${YELLOW}Trying again with verbose output:${NC}"
      psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$SQL_FILE" 2>&1 | tail -20
      echo ""
      echo "${YELLOW}SQL file saved for inspection:${NC}"
      echo "  $SQL_FILE"
      return 1
    fi
  fi
}

# ─── Display Summary ───────────────────────────────────────────────────────────

display_summary() {
  log_header "✓ BUDGET GENERATION COMPLETE"

  echo -e "${GREEN}Budgets Created:${NC}"
  echo "  ✓ Quarterly maintenance fund calls (Q1-Q4 2026)"
  echo "  ✓ Special works fund calls (renovations, repairs)"
  echo "  ✓ Multi-property support"
  echo ""
  echo -e "${YELLOW}Budget Types by Coproperty:${NC}"
  echo "  • Résidence Les Jardins: 5 fund calls (4 quarterly + 1 special)"
  echo "  • Villa Minerve Premium: 4 fund calls (quarterly only)"
  echo "  • Immeuble Carthage Elite: 6 fund calls (4 quarterly + 2 special)"
  echo "  • Complexe Résidentiel Sousse: 4 fund calls (quarterly only)"
  echo ""
  echo -e "${YELLOW}Total Value:${NC}"
  echo "  • Maintenance budgets 2026: ~381,600 TND"
  echo "  • Special works: ~118,000 TND"
  echo "  • Grand total: ~499,600 TND"
  echo ""
  echo -e "${YELLOW}Next Steps:${NC}"
  echo "  1. View budgets in application: Budget section"
  echo "  2. Assign budgets to owners via UI"
  echo "  3. Track payments in 'Paiements Charges' section"
}

# ─── Main ─────────────────────────────────────────────────────────────────────

main() {
  log_header "MYB BUDGET GENERATION"
  
  setup_database_connection || exit 1
  generate_budgets || exit 1
  display_summary
  
  echo ""
}

main "$@"
