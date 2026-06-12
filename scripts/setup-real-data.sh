#!/bin/bash
################################################################################
# setup-real-data.sh — Create Real Keycloak Users & Database Data
#
# Creates users in Keycloak with multiple roles and generates realistic
# coproperty data, units, budgets, and charges in the database.
#
# Roles created:
#   - coproperty-admin        (Full system access)
#   - coproperty-owner        (Apartment owners)
#   - MYB_EMPLOYEE            (Employees)
#   - MYB_MANAGER             (Managers)
#   - MYB_PROJECT_RW          (Project read-write)
#
# Usage:
#   ./scripts/setup-real-data.sh                    # Full setup
#   ./scripts/setup-real-data.sh --keycloak-only   # Only create Keycloak users
#   ./scripts/setup-real-data.sh --db-only         # Only create database data
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Configuration ──────────────────────────────────────────────────────────
KC_URL="${KC_URL:-http://localhost:8080}"
REALM="MYB"
CLIENT_ID_NAME="MYB-client"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"

# Database
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5433}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-copropertyDB}"

MODE="${1:-full}"  # full, keycloak-only, db-only

# ─── Colors & Output ───────────────────────────────────────────────────────
log_header() {
  echo -e "\n${BLUE}${BOLD}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}${BOLD}  $1${NC}"
  echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════${NC}\n"
}

log_step() {
  echo -e "${YELLOW}▶ $1${NC}"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
}

# ─── Keycloak Setup ────────────────────────────────────────────────────────

setup_keycloak() {
  log_header "KEYCLOAK SETUP — Creating Users & Roles"

  log_step "Obtaining admin token from $KC_URL..."
  
  TOKEN=$(curl -s -X POST "$KC_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=admin-cli" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASS" \
    -d "grant_type=password" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")

  if [ -z "$TOKEN" ]; then
    log_error "Failed to get admin token. Is Keycloak running at $KC_URL?"
    return 1
  fi
  log_success "Admin token obtained"

  # Get or create client
  log_step "Getting client UUID for '$CLIENT_ID_NAME'..."
  CLIENT_UUID=$(curl -s "$KC_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID_NAME" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null | python3 -c "import sys,json; clients=json.load(sys.stdin); print(clients[0]['id'] if clients else '')" 2>/dev/null || echo "")

  if [ -z "$CLIENT_UUID" ]; then
    log_error "Client '$CLIENT_ID_NAME' not found. Create it first or run keycloak-setup-roles-users.sh"
    return 1
  fi
  log_success "Client found: $CLIENT_UUID"

  # Create roles
  log_step "Creating client roles..."
  
  # Use parallel arrays to avoid bash parsing issues with hyphens in array keys
  ROLE_NAMES=(
    "coproperty-admin"
    "coproperty-owner"
    "MYB_EMPLOYEE"
    "MYB_MANAGER"
    "MYB_PROJECT_RW"
  )
  
  ROLE_DESCS=(
    "System Administrator — Full access"
    "Property Owner — View own properties"
    "MYB Employee — Staff access"
    "MYB Manager — Manager access"
    "Project Read-Write — Project management"
  )

  for i in "${!ROLE_NAMES[@]}"; do
    ROLE_NAME="${ROLE_NAMES[$i]}"
    ROLE_DESC="${ROLE_DESCS[$i]}"
    
    EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
      "$KC_URL/admin/realms/$REALM/clients/$CLIENT_UUID/roles/$ROLE_NAME" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "404")
    
    if [ "$EXISTS" != "200" ]; then
      curl -s -X POST "$KC_URL/admin/realms/$REALM/clients/$CLIENT_UUID/roles" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$ROLE_NAME\", \"description\": \"$ROLE_DESC\"}" 2>/dev/null
      log_success "Created role: $ROLE_NAME"
    else
      log_success "Role already exists: $ROLE_NAME"
    fi
  done

  # Create test users with roles
  log_step "Creating test users with roles..."
  
  create_keycloak_user() {
    local USERNAME="$1"
    local EMAIL="$2"
    local FIRST_NAME="$3"
    local LAST_NAME="$4"
    local PASSWORD="$5"
    local ROLE_NAME="$6"
    
    # Check if user exists
    USER_ID=$(curl -s "$KC_URL/admin/realms/$REALM/users?username=$USERNAME&exact=true" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null | python3 -c "import sys,json; users=json.load(sys.stdin); print(users[0]['id'] if users else '')" 2>/dev/null || echo "")
    
    if [ -z "$USER_ID" ]; then
      # Create user
      curl -s -X POST "$KC_URL/admin/realms/$REALM/users" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"username\": \"$USERNAME\",
          \"email\": \"$EMAIL\",
          \"firstName\": \"$FIRST_NAME\",
          \"lastName\": \"$LAST_NAME\",
          \"enabled\": true,
          \"emailVerified\": true,
          \"credentials\": [{
            \"type\": \"password\",
            \"value\": \"$PASSWORD\",
            \"temporary\": false
          }]
        }" 2>/dev/null
      
      # Fetch user ID
      USER_ID=$(curl -s "$KC_URL/admin/realms/$REALM/users?username=$USERNAME&exact=true" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null || echo "")
      
      log_success "Created user: $USERNAME ($FIRST_NAME $LAST_NAME)"
    else
      log_success "User already exists: $USERNAME"
    fi
    
    # Assign role
    if [ -n "$USER_ID" ]; then
      ROLE_JSON=$(curl -s "$KC_URL/admin/realms/$REALM/clients/$CLIENT_UUID/roles/$ROLE_NAME" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
      
      curl -s -X POST "$KC_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/clients/$CLIENT_UUID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "[$ROLE_JSON]" 2>/dev/null
      
      echo "     └─ Role: $ROLE_NAME"
    fi
  }

  # Create users with different roles
  log_success "Admins (coproperty-admin):"
  create_keycloak_user "admin" "admin@myb.com" "Admin" "System" "admin123" "coproperty-admin"
  create_keycloak_user "nidhal.admin" "nidhal.admin@myb.com" "Nidhal" "Admin" "nidhal123" "coproperty-admin"

  log_success "Employees (MYB_EMPLOYEE):"
  create_keycloak_user "employee1" "employee1@myb.com" "Jean" "Dupont" "emp123" "MYB_EMPLOYEE"
  create_keycloak_user "employee2" "employee2@myb.com" "Sophie" "Martin" "emp123" "MYB_EMPLOYEE"

  log_success "Managers (MYB_MANAGER):"
  create_keycloak_user "manager1" "manager1@myb.com" "Pierre" "Laurent" "mgr123" "MYB_MANAGER"
  create_keycloak_user "manager2" "manager2@myb.com" "Anne" "Beaumont" "mgr123" "MYB_MANAGER"

  log_success "Project Managers (MYB_PROJECT_RW):"
  create_keycloak_user "project_lead" "project@myb.com" "Marc" "Leclerc" "proj123" "MYB_PROJECT_RW"

  log_success "Property Owners (coproperty-owner):"
  create_keycloak_user "owner1" "owner1@example.com" "Haithem" "Khalifa" "owner123" "coproperty-owner"
  create_keycloak_user "owner2" "owner2@example.com" "Fatima" "Ben Ali" "owner123" "coproperty-owner"
  create_keycloak_user "owner3" "owner3@example.com" "Mohamed" "Triki" "owner123" "coproperty-owner"
  create_keycloak_user "owner4" "owner4@example.com" "Amina" "Mabrouk" "owner123" "coproperty-owner"

  log_success "Keycloak setup complete!"
}

# ─── Database Setup ────────────────────────────────────────────────────────

setup_database() {
  log_header "DATABASE SETUP — Creating Real Data"

  log_step "Connecting to PostgreSQL: $PGHOST:$PGPORT/$PGDATABASE..."

  # Determine if we should use Docker or local psql
  USE_DOCKER=false
  if ! command -v psql &>/dev/null; then
    # Try docker exec instead
    if command -v docker &>/dev/null && docker ps >/dev/null 2>&1; then
      USE_DOCKER=true
      log_step "Using Docker to connect to PostgreSQL..."
    else
      log_error "Neither psql nor Docker found. Install one of:"
      echo "  - PostgreSQL client: brew install postgresql"
      echo "  - Or ensure Docker is running: docker ps"
      return 1
    fi
  fi

  # Test connection
  log_step "Testing database connection..."
  if [ "$USE_DOCKER" = true ]; then
    # Detect container - look for postgres container with coproperty in name
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep -i "copropertydb" | head -1)
    
    if [ -z "$CONTAINER_NAME" ]; then
      log_error "Cannot find copropertyDB container"
      echo ""
      echo "${YELLOW}Running containers:${NC}"
      docker ps --format "table {{.Names}}" | head -10
      echo ""
      echo "${YELLOW}Start with:${NC}"
      echo "  docker compose -f docker-compose.yml up -d"
      return 1
    fi
    
    if ! docker exec "$CONTAINER_NAME" psql -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" 2>/dev/null; then
      log_error "Cannot connect to database via Docker container: $CONTAINER_NAME"
      echo ""
      echo "${YELLOW}Check database:${NC}"
      echo "  docker compose -f docker-compose.yml ps copropertyDB"
      echo "  docker compose -f docker-compose.yml logs copropertyDB"
      return 1
    fi
  else
    # Test with local psql
    if ! PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" 2>/dev/null; then
      log_error "Cannot connect to database"
      echo ""
      echo "${YELLOW}Solutions:${NC}"
      echo "  1. Start the database:"
      echo "     docker compose -f docker-compose.dev.yml up -d copropertyDB"
      echo ""
      echo "  2. Wait for it to be ready (~10 seconds)"
      echo ""
      echo "  3. Then run again:"
      echo "     ./scripts/setup-real-data.sh db-only"
      return 1
    fi
  fi
  log_success "Database connection OK"

  # Create temporary SQL file
  SQL_FILE="/tmp/myb_real_data_$(date +%s).sql"
  
  cat > "$SQL_FILE" << 'EOF'
-- ============================================
-- REAL DATA GENERATION FOR MYB PLATFORM
-- ============================================

-- 1. COPROPERTIES - Real Tunisian locations (Updated Schema)
INSERT INTO "Coproperties" ("Id", "Name", "Address", "City", "PostalCode", "Country", 
                           "Description", "TotalUnits", "TotalShares", "CommonAreas", "IsActive", "Currency", "CreatedAt", "UpdatedAt")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Résidence Les Jardins', '45 Avenue Habib Bourguiba', 'Tunis', '1000', 'Tunisia', 
   'Résidence prestige avec 12 appartements et penthouses', 12, 1200, 'Piscine, Gym, Parking souterrain', true, 'TND', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Villa Minerve Premium', '78 Rue de la Paix', 'Ariana', '2080', 'Tunisia', 
   'Complexe 8 villas avec piscine commune et gardiennage 24/24', 8, 800, 'Piscine partagée, Sécurité, Espaces verts', true, 'TND', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Immeuble Carthage Elite', '12 Boulevard El Amir', 'Carthage', '2070', 'Tunisia', 
   'Immeuble haut standing avec 10 appartements et penthouses', 10, 1000, 'Ascenseurs modernes, Concierge, Parking', true, 'TND', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Complexe Résidentiel Sousse', '33 Avenue de la Plage', 'Sousse', '4000', 'Tunisia', 
   'Résidence côtière avec 6 appartements vue mer', 6, 600, 'Plage privée, Restaur, Espaces verts littoraux', true, 'TND', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. OWNERS - Link to units/Keycloak users (Updated schema)
-- Note: Owners are linked to Units and Keycloak users via UserId
INSERT INTO "Owners" ("Id", "UserId", "FirstName", "LastName", "Email", "Phone", "CreatedAt", "UpdatedAt")
VALUES 
  ('650e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000001', 'Haithem', 'Khalifa', 'owner1@example.com', '+216 95 123 456', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000002', 'Fatima', 'Ben Ali', 'owner2@example.com', '+216 94 234 567', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000003', 'Mohamed', 'Triki', 'owner3@example.com', '+216 93 345 678', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000004', 'Amina', 'Mabrouk', 'owner4@example.com', '+216 92 456 789', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440005', '00000000-0000-0000-0000-000000000005', 'Karim', 'Salah', 'owner5@example.com', '+216 91 567 890', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440006', '00000000-0000-0000-0000-000000000006', 'Leila', 'Zahra', 'owner6@example.com', '+216 90 678 901', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440007', '00000000-0000-0000-0000-000000000007', 'Nidhal', 'Ben Amor', 'nidhal@example.com', '+216 95 111 222', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440008', '00000000-0000-0000-0000-000000000008', 'Sonia', 'Khaled', 'sonia@example.com', '+216 94 222 333', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 3. UNITS - Realistic apartments and villas (Updated to match actual schema)
INSERT INTO "Units" ("Id", "CopropertyId", "UnitNumber", "UnitType", "Area", "Floor", "Shares", "IsOccupied", "CreatedAt", "UpdatedAt")
VALUES 
  -- Résidence Les Jardins (12 units)
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'A01', 'Apartment', 85.0, 0, 85, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'A02', 'Apartment', 95.0, 0, 95, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'B12', 'Apartment', 120.5, 1, 121, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'B13', 'Apartment', 95.0, 1, 95, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'C21', 'Apartment', 140.0, 2, 140, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'C22', 'Apartment', 110.0, 2, 110, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'D31', 'Apartment', 135.0, 3, 135, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 'D32', 'Apartment', 100.0, 3, 100, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 'E41', 'Apartment', 155.0, 4, 155, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'E42', 'Apartment', 120.0, 4, 120, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'F51', 'Apartment', 145.0, 5, 145, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'F52', 'Penthouse', 200.0, 5, 200, false, NOW(), NOW()),
  
  -- Villa Minerve Premium (8 units)
  ('850e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'V01', 'Villa', 250.0, 0, 250, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'V02', 'Villa', 280.0, 0, 280, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'V03', 'Villa', 260.0, 0, 260, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'V04', 'Villa', 245.0, 0, 245, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440002', 'V05', 'Villa', 275.0, 0, 275, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440002', 'V06', 'Villa', 290.0, 0, 290, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440002', 'V07', 'Villa', 255.0, 0, 255, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', 'V08', 'Villa', 310.0, 0, 310, false, NOW(), NOW()),
  
  -- Immeuble Carthage Elite (10 units)
  ('850e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'G01', 'Apartment', 100.0, 0, 100, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'G02', 'Apartment', 90.0, 0, 90, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'H11', 'Apartment', 110.0, 1, 110, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', 'H12', 'Apartment', 105.0, 1, 105, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440003', 'I21', 'Apartment', 120.0, 2, 120, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'I22', 'Apartment', 115.0, 2, 115, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440003', 'J31', 'Apartment', 130.0, 3, 130, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440003', 'J32', 'Apartment', 125.0, 3, 125, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440003', 'K41', 'Penthouse', 180.0, 4, 180, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440003', 'K42', 'Penthouse', 190.0, 4, 190, false, NOW(), NOW()),
  
  -- Complexe Résidentiel Sousse (6 units)
  ('850e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440004', 'S01', 'Apartment', 80.0, 0, 80, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440004', 'S02', 'Apartment', 85.0, 0, 85, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440004', 'T11', 'Apartment', 95.0, 1, 95, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440004', 'T12', 'Apartment', 100.0, 1, 100, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440004', 'U21', 'Apartment', 110.0, 2, 110, false, NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440004', 'U22', 'Apartment', 105.0, 2, 105, false, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 4. OWNER-UNIT RELATIONSHIPS (junction table — requires OwnerUnits migration to be applied first)
INSERT INTO "OwnerUnits" ("Id", "OwnerId", "UnitId", "OwnershipPercentage", "CreatedAt", "UpdatedAt")
VALUES 
  ('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440003', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440005', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440007', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440013', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440021', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440031', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440008', '850e8400-e29b-41d4-a716-446655440014', 100.0, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Also update legacy UnitId column on Owners for backward compatibility
UPDATE "Owners" SET "UnitId" = '850e8400-e29b-41d4-a716-446655440001' WHERE "Id" = '650e8400-e29b-41d4-a716-446655440001';
UPDATE "Owners" SET "UnitId" = '850e8400-e29b-41d4-a716-446655440003' WHERE "Id" = '650e8400-e29b-41d4-a716-446655440002';
UPDATE "Owners" SET "UnitId" = '850e8400-e29b-41d4-a716-446655440005' WHERE "Id" = '650e8400-e29b-41d4-a716-446655440003';
UPDATE "Owners" SET "UnitId" = '850e8400-e29b-41d4-a716-446655440007' WHERE "Id" = '650e8400-e29b-41d4-a716-446655440004';
UPDATE "Owners" SET "UnitId" = '850e8400-e29b-41d4-a716-446655440013' WHERE "Id" = '650e8400-e29b-41d4-a716-446655440005';
UPDATE "Owners" SET "UnitId" = '850e8400-e29b-41d4-a716-446655440021' WHERE "Id" = '650e8400-e29b-41d4-a716-446655440006';
UPDATE "Owners" SET "UnitId" = '850e8400-e29b-41d4-a716-446655440031' WHERE "Id" = '650e8400-e29b-41d4-a716-446655440007';
UPDATE "Owners" SET "UnitId" = '850e8400-e29b-41d4-a716-446655440014' WHERE "Id" = '650e8400-e29b-41d4-a716-446655440008';

-- 5. CHARGES (with all required fields)
INSERT INTO "Charges" ("Id", "CopropertyId", "Name", "Description", "ChargeType", "Frequency",
                       "TotalAmount", "DistributionMethod", "StartDate", "IsActive", "CreatedBy", "CreatedAt", "UpdatedAt")
VALUES 
  -- Résidence Les Jardins
  ('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Charges Courantes', 
   'Maintenance, gardiennage, électricité commune', 'Maintenance', 'Monthly', 8500.00, 'ByArea', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Travaux Façade 2026', 
   'Ravalement de façade et peinture extérieure', 'Maintenance', 'Once', 35000.00, 'Equal', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Toiture', 
   'Inspection et réparation toiture', 'Maintenance', 'Once', 12000.00, 'ByShares', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  
  -- Villa Minerve Premium
  ('b50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Charges d''Exploitation', 
   'Eau, électricité, chauffage, gaz', 'Maintenance', 'Monthly', 6200.00, 'ByArea', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Piscine - Maintenance', 
   'Entretien piscine, chloration, filtration', 'Water', 'Monthly', 2800.00, 'Equal', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Sécurité - Gardiennage', 
   'Gardiennage 24/24, surveillance vidéo', 'Security', 'Monthly', 8000.00, 'ByArea', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  
  -- Immeuble Carthage Elite
  ('b50e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Charges Communes', 
   'Ascenseurs, électricité commune, éclairage', 'Electricity', 'Monthly', 9200.00, 'ByShares', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Remplacement Ascenseurs', 
   'Modernisation et remplacement des 3 ascenseurs', 'Maintenance', 'Once', 65000.00, 'Equal', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'Étanchéité Terrasses', 
   'Réparation étanchéité et imperméabilisation', 'Maintenance', 'Once', 18000.00, 'ByArea', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  
  -- Complexe Résidentiel Sousse
  ('b50e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'Charges Communes', 
   'Électricité, eau, gaz, gardiennage', 'Maintenance', 'Monthly', 5500.00, 'ByArea', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'Aménagement Espaces Verts', 
   'Entretien jardins, espaces extérieurs', 'Maintenance', 'Monthly', 3000.00, 'Equal', NOW(), true, 
   '00000000-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Real data generation complete!' AS status;
EOF

  # Execute SQL with psql or docker
  if [ "$USE_DOCKER" = true ]; then
    # For Docker, pipe SQL directly to psql since file is local
    if cat "$SQL_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; then
      log_success "Database data generated successfully"
      rm -f "$SQL_FILE"
    else
      log_error "Failed to generate database data"
      echo ""
      echo "${YELLOW}Trying again with verbose output:${NC}"
      cat "$SQL_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$PGUSER" -d "$PGDATABASE" 2>&1 | tail -30
      echo ""
      echo "${YELLOW}SQL file saved for inspection:${NC}"
      echo "  $SQL_FILE"
      return 1
    fi
  else
    export PGPASSWORD="$PGPASSWORD"
    if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$SQL_FILE" >/dev/null 2>&1; then
      log_success "Database data generated successfully"
      rm -f "$SQL_FILE"
    else
      log_error "Failed to generate database data"
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

# ─── Main Script ────────────────────────────────────────────────────────────

main() {
  log_header "MYB REAL DATA SETUP"
  
  echo "Mode: ${MODE}"
  echo "Keycloak URL: $KC_URL"
  echo "Database: $PGHOST:$PGPORT/$PGDATABASE"
  echo ""

  case "$MODE" in
    full)
      setup_keycloak && setup_database
      ;;
    keycloak-only)
      setup_keycloak
      ;;
    db-only)
      setup_database
      ;;
    *)
      log_error "Unknown mode: $MODE"
      echo "Usage: $0 [full|keycloak-only|db-only]"
      exit 1
      ;;
  esac

  if [ $? -eq 0 ]; then
    log_header "✓ SETUP COMPLETE"
    echo ""
    echo "${GREEN}Test Accounts Created:${NC}"
    echo "  Admin:        admin / admin123"
    echo "  Employee:     employee1 / emp123"
    echo "  Manager:      manager1 / mgr123"
    echo "  Project Lead: project_lead / proj123"
    echo "  Owner 1:      owner1 / owner123"
    echo "  Owner 2:      owner2 / owner123"
    echo ""
    echo "${GREEN}Real Data Created:${NC}"
    echo "  ✓ 4 Coproperties"
    echo "  ✓ 36 Units (Apartments, Villas, Penthouses)"
    echo "  ✓ 8 Owners"
    echo "  ✓ 4 Budgets 2026"
    echo "  ✓ 11 Charges (Maintenance & Special Works)"
    echo ""
    echo "${YELLOW}You can now:${NC}"
    echo "  1. Start the application: ./scripts/dev-local-frontend.sh client"
    echo "  2. Login with test accounts"
    echo "  3. View coproperties, units, budgets, and charges"
    echo ""
  else
    log_error "Setup failed"
    exit 1
  fi
}

main "$@"
