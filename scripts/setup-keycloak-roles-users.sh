#!/bin/bash

################################################################################
# MYB Keycloak Roles & Users Setup Script
# Purpose: Create Keycloak roles and assign them to test users
# Usage: ./scripts/setup-keycloak-roles-users.sh
################################################################################

set -e

# Configuration
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_REALM="MYB"
KEYCLOAK_CLIENT="MYB-client"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  MYB KEYCLOAK ROLES & USERS SETUP${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "Keycloak URL: ${BLUE}${KEYCLOAK_URL}${NC}"
echo -e "Realm: ${BLUE}${KEYCLOAK_REALM}${NC}"
echo ""

# Function to get admin token
get_admin_token() {
    echo -e "${YELLOW}▶${NC} Obtaining admin token from ${KEYCLOAK_URL}..."
    
    TOKEN=$(curl -s -X POST \
        "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "client_id=admin-cli" \
        -d "username=${ADMIN_USER}" \
        -d "password=${ADMIN_PASSWORD}" \
        -d "grant_type=password" | jq -r '.access_token' 2>/dev/null)
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
        echo -e "${RED}✗ Failed to obtain admin token${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} Admin token obtained"
}

# Function to get client UUID
get_client_uuid() {
    echo -e "${YELLOW}▶${NC} Getting client UUID for '${KEYCLOAK_CLIENT}'..."
    
    CLIENT_UUID=$(curl -s -X GET \
        "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients?clientId=${KEYCLOAK_CLIENT}" \
        -H "Authorization: Bearer ${TOKEN}" | jq -r '.[0].id' 2>/dev/null)
    
    if [ -z "$CLIENT_UUID" ] || [ "$CLIENT_UUID" == "null" ]; then
        echo -e "${RED}✗ Failed to get client UUID${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} Client found: ${CLIENT_UUID}"
}

# Function to create a role
create_role() {
    local role_name=$1
    
    # Check if role exists
    ROLE_EXISTS=$(curl -s -X GET \
        "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${CLIENT_UUID}/roles/${role_name}" \
        -H "Authorization: Bearer ${TOKEN}" | jq -r '.name' 2>/dev/null)
    
    if [ "$ROLE_EXISTS" == "$role_name" ]; then
        echo -e "${GREEN}✓${NC} Role already exists: ${role_name}"
        return 0
    fi
    
    # Create role
    curl -s -X POST \
        "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${CLIENT_UUID}/roles" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"${role_name}\", \"description\": \"${role_name} role\"}" > /dev/null
    
    echo -e "${GREEN}✓${NC} Role created: ${role_name}"
}

# Function to create user
create_user() {
    local username=$1
    local password=$2
    local first_name=$3
    local last_name=$4
    
    # Check if user exists
    USER_ID=$(curl -s -X GET \
        "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${username}&exact=true" \
        -H "Authorization: Bearer ${TOKEN}" | jq -r '.[0].id' 2>/dev/null)
    
    if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
        echo -e "${GREEN}✓${NC} User already exists: ${username}" >&2
        echo "$USER_ID"
        return 0
    fi
    
    # Create user
    USER_RESPONSE=$(curl -s -X POST \
        "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${username}\",
            \"firstName\": \"${first_name}\",
            \"lastName\": \"${last_name}\",
            \"enabled\": true,
            \"credentials\": [{
                \"type\": \"password\",
                \"value\": \"${password}\",
                \"temporary\": false
            }]
        }")
    
    echo -e "${GREEN}✓${NC} User created: ${username} (${first_name} ${last_name})" >&2
    
    # Get user ID
    USER_ID=$(curl -s -X GET \
        "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${username}&exact=true" \
        -H "Authorization: Bearer ${TOKEN}" | jq -r '.[0].id')
    
    echo "$USER_ID"
}

# Function to assign role to user
assign_role_to_user() {
    local user_id=$1
    local role_name=$2
    
    # Get role
    ROLE=$(curl -s -X GET \
        "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${CLIENT_UUID}/roles/${role_name}" \
        -H "Authorization: Bearer ${TOKEN}")
    
    # Assign role
    curl -s -X POST \
        "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${user_id}/role-mappings/clients/${CLIENT_UUID}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "[${ROLE}]" > /dev/null
}

# Main execution
main() {
    # Get token and client UUID
    get_admin_token
    get_client_uuid
    
    echo ""
    echo -e "${BLUE}▶ Creating client roles...${NC}"
    
    # Define roles
    declare -a ROLES=(
        "coproperty-admin"
        "coproperty-owner"
        "coproperty-council"
        "coproperty-accountant"
        "MYB_EMPLOYEE"
        "MYB_MANAGER"
        "MYB_PROJECT_RW"
    )
    
    for role in "${ROLES[@]}"; do
        create_role "$role"
    done
    
    echo ""
    echo -e "${BLUE}▶ Creating test users and assigning roles...${NC}"
    
    # Define users with format: username:password:first_name:last_name:role1,role2
    declare -a USERS=(
        "admin:admin123:Admin:System:coproperty-admin"
        "nidhal.admin:admin123:Nidhal:Admin:coproperty-admin"
        "owner1:owner123:Haithem:Khalifa:coproperty-owner"
        "owner2:owner123:Fatima:Ben Ali:coproperty-owner"
        "owner3:owner123:Mohamed:Triki:coproperty-owner"
        "owner4:owner123:Amina:Mabrouk:coproperty-owner"
        "employee1:emp123:Jean:Dupont:MYB_EMPLOYEE"
        "employee2:emp123:Sophie:Martin:MYB_EMPLOYEE"
        "manager1:mgr123:Pierre:Laurent:MYB_MANAGER"
        "manager2:mgr123:Anne:Beaumont:MYB_MANAGER"
        "project_lead:proj123:Marc:Leclerc:MYB_PROJECT_RW"
    )
    
    for user_config in "${USERS[@]}"; do
        IFS=':' read -r username password first_name last_name roles <<< "$user_config"
        
        # Create user
        USER_ID=$(create_user "$username" "$password" "$first_name" "$last_name")
        
        # Assign roles
        IFS=',' read -ra ROLE_ARRAY <<< "$roles"
        for role in "${ROLE_ARRAY[@]}"; do
            assign_role_to_user "$USER_ID" "$role"
        done
    done
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ KEYCLOAK SETUP COMPLETE${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Test Accounts Created:${NC}"
    echo "  Admin:        admin / admin123"
    echo "  Owner:        owner1 / owner123"
    echo "  Employee:     employee1 / emp123"
    echo "  Manager:      manager1 / mgr123"
    echo "  Project Lead: project_lead / proj123"
    echo ""
}

main "$@"
