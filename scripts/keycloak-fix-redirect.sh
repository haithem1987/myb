#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🔧 Keycloak Redirect URI Fix for MYB Project${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Step 1: Access Keycloak Admin Console
echo -e "${YELLOW}📋 STEP 1: Access Keycloak Admin Console${NC}"
echo -e "   URL: ${GREEN}http://localhost:8080/admin${NC}"
echo -e "   Username: ${GREEN}admin${NC}"
echo -e "   Password: ${GREEN}admin${NC}\n"
read -p "Press Enter when logged in..."

# Step 2: Select Realm
echo -e "\n${YELLOW}📋 STEP 2: Select MYB Realm${NC}"
echo -e "   1. Click the realm dropdown (top-left, currently shows 'master')"
echo -e "   2. Select: ${GREEN}MYB${NC}"
echo -e "   ${RED}⚠️  If MYB realm doesn't exist, create it:${NC}"
echo -e "      - Click 'Create Realm'"
echo -e "      - Realm name: ${GREEN}MYB${NC}"
echo -e "      - Click 'Create'\n"
read -p "Press Enter when MYB realm is selected..."

# Step 3: Configure Client
echo -e "\n${YELLOW}📋 STEP 3: Configure MYB-client${NC}"
echo -e "   ${BLUE}Navigate to: Clients → MYB-client${NC}"
echo -e "   ${RED}⚠️  If MYB-client doesn't exist, create it:${NC}"
echo -e "      - Click 'Create client'"
echo -e "      - Client ID: ${GREEN}MYB-client${NC}"
echo -e "      - Click 'Next' → 'Next' → 'Save'\n"
read -p "Press Enter when viewing MYB-client settings..."

# Step 4: Configure Redirect URIs
echo -e "\n${YELLOW}📋 STEP 4: Configure Valid Redirect URIs${NC}"
echo -e "   ${BLUE}In the MYB-client Settings tab:${NC}\n"
echo -e "   1. Scroll to ${GREEN}'Valid redirect URIs'${NC}"
echo -e "   2. ${RED}DELETE${NC} any existing URIs"
echo -e "   3. ${GREEN}ADD${NC} the following URIs (one per line):\n"
echo -e "      ${GREEN}http://localhost:4200/*${NC}"
echo -e "      ${GREEN}http://localhost:4201/*${NC}\n"
echo -e "   4. Scroll to ${GREEN}'Valid post logout redirect URIs'${NC}"
echo -e "   5. ${GREEN}ADD${NC} the following URIs:\n"
echo -e "      ${GREEN}http://localhost:4200/*${NC}"
echo -e "      ${GREEN}http://localhost:4201/*${NC}\n"
echo -e "   6. Scroll to ${GREEN}'Web origins'${NC}"
echo -e "   7. ${GREEN}ADD${NC}: ${GREEN}+${NC} (this allows CORS for all redirect URIs)\n"
read -p "Press Enter when redirect URIs are configured..."

# Step 5: Additional Settings
echo -e "\n${YELLOW}📋 STEP 5: Verify Additional Settings${NC}"
echo -e "   ${BLUE}In the same Settings tab, verify:${NC}\n"
echo -e "   ✅ Client authentication: ${GREEN}OFF${NC} (public client)"
echo -e "   ✅ Standard flow: ${GREEN}ENABLED${NC}"
echo -e "   ✅ Direct access grants: ${GREEN}ENABLED${NC}"
echo -e "   ✅ Implicit flow: ${GREEN}DISABLED${NC}\n"

echo -e "   ${BLUE}Advanced Settings (expand at bottom):${NC}\n"
echo -e "   ✅ Proof Key for Code Exchange (PKCE): ${GREEN}S256${NC}\n"
read -p "Press Enter when settings are verified..."

# Step 6: Save
echo -e "\n${YELLOW}📋 STEP 6: Save Configuration${NC}"
echo -e "   Click the ${GREEN}'Save'${NC} button at the bottom of the page\n"
read -p "Press Enter when saved..."

# Step 7: Create Realm Roles
echo -e "\n${YELLOW}📋 STEP 7: Create Realm Roles${NC}"
echo -e "   ${BLUE}Navigate to: Realm roles → Create role${NC}\n"
echo -e "   Create the following roles (one at a time):\n"
echo -e "   1. ${GREEN}coproperty-syndic${NC}    - Syndic management role"
echo -e "   2. ${GREEN}coproperty-owner${NC}     - Owner access role"
echo -e "   3. ${GREEN}coproperty-council${NC}   - Council member role"
echo -e "   4. ${GREEN}coproperty-accountant${NC} - Accountant role"
echo -e "   5. ${GREEN}system-admin${NC}         - System administrator role\n"
read -p "Press Enter when all roles are created..."

# Step 8: Create Test User
echo -e "\n${YELLOW}📋 STEP 8: Create Test User (Syndic)${NC}"
echo -e "   ${BLUE}Navigate to: Users → Create new user${NC}\n"
echo -e "   ${GREEN}User Details:${NC}"
echo -e "   • Username: ${GREEN}marie.dubois${NC}"
echo -e "   • Email: ${GREEN}marie.dubois@gestion-dubois.fr${NC}"
echo -e "   • First name: ${GREEN}Marie${NC}"
echo -e "   • Last name: ${GREEN}Dubois${NC}"
echo -e "   • Email verified: ${GREEN}ON${NC}"
echo -e "   Click ${GREEN}'Create'${NC}\n"
read -p "Press Enter when user is created..."

# Step 9: Set Password
echo -e "\n${YELLOW}📋 STEP 9: Set User Password${NC}"
echo -e "   ${BLUE}In the user details page:${NC}\n"
echo -e "   1. Click the ${GREEN}'Credentials'${NC} tab"
echo -e "   2. Click ${GREEN}'Set password'${NC}"
echo -e "   3. Password: ${GREEN}Syndic123!${NC}"
echo -e "   4. Password confirmation: ${GREEN}Syndic123!${NC}"
echo -e "   5. Temporary: ${RED}OFF${NC}"
echo -e "   6. Click ${GREEN}'Save'${NC}\n"
read -p "Press Enter when password is set..."

# Step 10: Assign Roles
echo -e "\n${YELLOW}📋 STEP 10: Assign Role to User${NC}"
echo -e "   ${BLUE}In the user details page:${NC}\n"
echo -e "   1. Click the ${GREEN}'Role mapping'${NC} tab"
echo -e "   2. Click ${GREEN}'Assign role'${NC}"
echo -e "   3. Filter: ${GREEN}realm roles${NC}"
echo -e "   4. Select: ${GREEN}coproperty-syndic${NC}"
echo -e "   5. Click ${GREEN}'Assign'${NC}\n"
read -p "Press Enter when role is assigned..."

# Completion
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Keycloak Configuration Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}🧪 Test the Configuration:${NC}\n"
echo -e "1. Open browser to: ${GREEN}http://localhost:4201${NC}"
echo -e "2. You should see the admin app"
echo -e "3. Click login/access protected route"
echo -e "4. Keycloak login page should appear"
echo -e "5. Login with:"
echo -e "   Username: ${GREEN}marie.dubois${NC}"
echo -e "   Password: ${GREEN}Syndic123!${NC}"
echo -e "6. You should be redirected back to ${GREEN}http://localhost:4201${NC}\n"

echo -e "${BLUE}📚 Additional Documentation:${NC}"
echo -e "   • Full config guide: ${GREEN}docs/KEYCLOAK_CONFIGURATION.md${NC}"
echo -e "   • User scenarios: ${GREEN}docs/COPROPERTY_USER_SCENARIOS.md${NC}\n"

echo -e "${YELLOW}💡 Create more test users:${NC}"
echo -e "   Owner: jean.martin / Owner123! (role: coproperty-owner)"
echo -e "   Council: sophie.bernard / Council123! (role: coproperty-council)"
echo -e "   Accountant: pierre.leroy / Account123! (role: coproperty-accountant)\n"

echo -e "${GREEN}Happy testing! 🚀${NC}\n"
