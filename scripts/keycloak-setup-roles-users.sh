#!/bin/bash
###############################################################################
# Keycloak Setup Script — Client Roles & Test Users
# Creates the required client roles on MYB-client and test users with roles.
#
# Prerequisites: Keycloak running at $KC_URL with admin/admin credentials.
# Usage: bash scripts/keycloak-setup-roles-users.sh
###############################################################################

set -euo pipefail

KC_URL="${KC_URL:-http://localhost:8080}"
REALM="MYB"
CLIENT_ID_NAME="MYB-client"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"

echo "=== MYB Keycloak Setup ==="
echo "URL: $KC_URL | Realm: $REALM | Client: $CLIENT_ID_NAME"
echo ""

# ─── 1. Get admin access token ──────────────────────────────────────────────
echo "→ Obtaining admin token..."
TOKEN=$(curl -s -X POST "$KC_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASS" \
  -d "grant_type=password" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get admin token. Check Keycloak is running and credentials are correct."
  exit 1
fi
echo "✅ Admin token obtained"

# ─── 2. Create realm if needed ──────────────────────────────────────────────
echo ""
echo "→ Checking realm '$REALM'..."
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" "$KC_URL/admin/realms/$REALM" \
  -H "Authorization: Bearer $TOKEN")

if [ "$REALM_EXISTS" = "404" ]; then
  echo "  Creating realm '$REALM'..."
  curl -s -X POST "$KC_URL/admin/realms" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"realm\": \"$REALM\",
      \"enabled\": true,
      \"registrationAllowed\": true,
      \"registrationEmailAsUsername\": true,
      \"verifyEmail\": true,
      \"loginWithEmailAllowed\": true,
      \"duplicateEmailsAllowed\": false,
      \"resetPasswordAllowed\": true
    }"
  echo "  ✅ Realm created"
else
  echo "  ✅ Realm already exists"
fi

# ─── 3. Get or create client ────────────────────────────────────────────────
echo ""
echo "→ Looking up client '$CLIENT_ID_NAME'..."
CLIENT_UUID=$(curl -s "$KC_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID_NAME" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
clients = json.load(sys.stdin)
print(clients[0]['id'] if clients else '')
")

if [ -z "$CLIENT_UUID" ]; then
  echo "  Creating client '$CLIENT_ID_NAME'..."
  curl -s -X POST "$KC_URL/admin/realms/$REALM/clients" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"$CLIENT_ID_NAME\",
      \"enabled\": true,
      \"publicClient\": true,
      \"directAccessGrantsEnabled\": true,
      \"standardFlowEnabled\": true,
      \"redirectUris\": [\"http://localhost:4200/*\", \"http://localhost:4201/*\"],
      \"webOrigins\": [\"http://localhost:4200\", \"http://localhost:4201\"]
    }"
  CLIENT_UUID=$(curl -s "$KC_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID_NAME" \
    -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
  echo "  ✅ Client created (UUID: $CLIENT_UUID)"
else
  echo "  ✅ Client found (UUID: $CLIENT_UUID)"
fi

# ─── 4. Create client roles ─────────────────────────────────────────────────
echo ""
echo "→ Creating client roles on '$CLIENT_ID_NAME'..."

ROLES=(
  "coproperty-syndic"
  "coproperty-owner"
  "coproperty-council"
  "coproperty-accountant"
  "coproperty-admin"
  "system-admin"
)

ROLE_DESCRIPTIONS=(
  "Syndic — Full coproperty management (coproperties, units, owners, budgets, fund calls, reports)"
  "Owner — Copropriétaire (view lots, invoices, maintenance requests, documents, AG)"
  "Council — Conseil Syndical (read-only view of finances, reports)"
  "Accountant — Comptable (manage charges, invoices, financial reports)"
  "Admin — Coproperty module administrator"
  "System Admin — Full system access"
)

for i in "${!ROLES[@]}"; do
  ROLE_NAME="${ROLES[$i]}"
  ROLE_DESC="${ROLE_DESCRIPTIONS[$i]}"
  
  # Check if role exists
  EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$KC_URL/admin/realms/$REALM/clients/$CLIENT_UUID/roles/$ROLE_NAME" \
    -H "Authorization: Bearer $TOKEN")
  
  if [ "$EXISTS" = "404" ]; then
    curl -s -X POST "$KC_URL/admin/realms/$REALM/clients/$CLIENT_UUID/roles" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\": \"$ROLE_NAME\", \"description\": \"$ROLE_DESC\"}"
    echo "  ✅ Created role: $ROLE_NAME"
  else
    echo "  ⏭  Role already exists: $ROLE_NAME"
  fi
done

# ─── 5. Create test users ───────────────────────────────────────────────────
echo ""
echo "→ Creating test users..."

create_user_with_role() {
  local USERNAME="$1"
  local EMAIL="$2"
  local FIRST_NAME="$3"
  local LAST_NAME="$4"
  local PASSWORD="$5"
  local ROLE_NAME="$6"
  
  # Check if user exists
  USER_ID=$(curl -s "$KC_URL/admin/realms/$REALM/users?username=$USERNAME&exact=true" \
    -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
users = json.load(sys.stdin)
print(users[0]['id'] if users else '')
" 2>/dev/null || echo "")
  
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
      }"
    
    # Fetch user ID
    USER_ID=$(curl -s "$KC_URL/admin/realms/$REALM/users?username=$USERNAME&exact=true" \
      -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
    echo "  ✅ Created user: $USERNAME ($FIRST_NAME $LAST_NAME) — ID: $USER_ID"
  else
    echo "  ⏭  User already exists: $USERNAME — ID: $USER_ID"
  fi
  
  # Assign client role
  ROLE_JSON=$(curl -s "$KC_URL/admin/realms/$REALM/clients/$CLIENT_UUID/roles/$ROLE_NAME" \
    -H "Authorization: Bearer $TOKEN")
  
  curl -s -X POST "$KC_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/clients/$CLIENT_UUID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "[$ROLE_JSON]"
  echo "     → Assigned role: $ROLE_NAME"
}

# ── Syndic user ──
create_user_with_role \
  "syndic" \
  "syndic@myb-test.com" \
  "Marie" \
  "Dubois" \
  "syndic123" \
  "coproperty-syndic"

# ── Owner user ──
create_user_with_role \
  "owner" \
  "owner@myb-test.com" \
  "Jean" \
  "Martin" \
  "owner123" \
  "coproperty-owner"

# ── Council user ──  
create_user_with_role \
  "council" \
  "council@myb-test.com" \
  "Pierre" \
  "Durand" \
  "council123" \
  "coproperty-council"

# ── Accountant user ──
create_user_with_role \
  "accountant" \
  "accountant@myb-test.com" \
  "Sophie" \
  "Bernard" \
  "accountant123" \
  "coproperty-accountant"

# ── Admin user ──
create_user_with_role \
  "sysadmin" \
  "admin@myb-test.com" \
  "Admin" \
  "System" \
  "admin123" \
  "system-admin"

# ─── 6. Summary ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅  Keycloak setup complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Test Users (password shown after →):"
echo "  ┌──────────────────┬──────────────────┬────────────────────┐"
echo "  │ Username         │ Password         │ Role               │"
echo "  ├──────────────────┼──────────────────┼────────────────────┤"
echo "  │ syndic           │ syndic123        │ coproperty-syndic  │"
echo "  │ owner            │ owner123         │ coproperty-owner   │"
echo "  │ council          │ council123       │ coproperty-council │"
echo "  │ accountant       │ accountant123    │ coproperty-accountant │"
echo "  │ sysadmin         │ admin123         │ system-admin       │"
echo "  └──────────────────┴──────────────────┴────────────────────┘"
echo ""
echo "  Open http://localhost:4201 and login with any user above."
echo "  Role-based redirect:"
echo "    syndic     → /coproperty/syndic/dashboard"
echo "    owner      → /coproperty/owner/dashboard"
echo "    council    → /coproperty/council/dashboard"
echo "    accountant → /coproperty/accountant/dashboard"
echo ""
