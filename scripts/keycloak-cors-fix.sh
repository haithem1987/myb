#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🔧 Keycloak CORS & Redirect URI Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}🎯 This script will fix the CORS error you're seeing${NC}\n"

echo -e "${RED}Current Error:${NC}"
echo -e "Access to XMLHttpRequest has been blocked by CORS policy"
echo -e "No 'Access-Control-Allow-Origin' header is present\n"

echo -e "${GREEN}Solution: Configure Keycloak Client Properly${NC}\n"

# Step 1
echo -e "${YELLOW}📋 STEP 1: Open Keycloak Admin Console${NC}"
echo -e "   1. Open: ${GREEN}http://localhost:8080/admin${NC}"
echo -e "   2. Login: ${GREEN}admin / admin${NC}\n"
read -p "Press Enter when logged in..."

# Step 2
echo -e "\n${YELLOW}📋 STEP 2: Select MYB Realm${NC}"
echo -e "   • Top-left dropdown → Select ${GREEN}MYB${NC}"
echo -e "   ${RED}If MYB doesn't exist:${NC} Create it first (Create Realm button)\n"
read -p "Press Enter when MYB realm is selected..."

# Step 3
echo -e "\n${YELLOW}📋 STEP 3: Configure MYB-client${NC}"
echo -e "   ${BLUE}Go to: Clients → MYB-client (or Create if doesn't exist)${NC}\n"
read -p "Press Enter when viewing MYB-client..."

# Step 4
echo -e "\n${YELLOW}📋 STEP 4: Settings Tab Configuration${NC}"
echo -e "   ${GREEN}Scroll down and configure these EXACT values:${NC}\n"

echo -e "   ${BLUE}Valid redirect URIs:${NC}"
echo -e "   ${GREEN}http://localhost:4200/*${NC}"
echo -e "   ${GREEN}http://localhost:4201/*${NC}"
echo -e "   (Delete any other URIs)\n"

echo -e "   ${BLUE}Valid post logout redirect URIs:${NC}"
echo -e "   ${GREEN}http://localhost:4200/*${NC}"
echo -e "   ${GREEN}http://localhost:4201/*${NC}\n"

echo -e "   ${BLUE}Web origins:${NC}"
echo -e "   ${GREEN}+${NC}"
echo -e "   ${YELLOW}(The plus sign tells Keycloak to allow CORS for all redirect URIs)${NC}\n"

echo -e "   ${BLUE}Other Settings (verify):${NC}"
echo -e "   • Client authentication: ${GREEN}OFF${NC}"
echo -e "   • Authorization: ${GREEN}OFF${NC}"
echo -e "   • Standard flow: ${GREEN}ON${NC}"
echo -e "   • Direct access grants: ${GREEN}ON${NC}"
echo -e "   • Implicit flow: ${GREEN}OFF${NC}\n"

read -p "Press Enter when configured..."

# Step 5
echo -e "\n${YELLOW}📋 STEP 5: Advanced Settings${NC}"
echo -e "   ${BLUE}Scroll to 'Advanced' section at the bottom:${NC}\n"
echo -e "   • Proof Key for Code Exchange Code Challenge Method: ${GREEN}S256${NC}\n"
read -p "Press Enter when configured..."

# Step 6
echo -e "\n${YELLOW}📋 STEP 6: SAVE Configuration${NC}"
echo -e "   ${RED}⚠️  IMPORTANT:${NC} Click the ${GREEN}'Save'${NC} button at the bottom!\n"
read -p "Press Enter after saving..."

# Step 7
echo -e "\n${YELLOW}📋 STEP 7: Create Test User (if not exists)${NC}"
echo -e "   ${BLUE}Go to: Users → Create new user${NC}\n"
echo -e "   • Username: ${GREEN}marie.dubois${NC}"
echo -e "   • Email: ${GREEN}marie.dubois@test.com${NC}"
echo -e "   • Email verified: ${GREEN}ON${NC}"
echo -e "   • First name: ${GREEN}Marie${NC}"
echo -e "   • Last name: ${GREEN}Dubois${NC}"
echo -e "   Click ${GREEN}'Create'${NC}\n"
read -p "Press Enter if user created/exists..."

# Step 8
echo -e "\n${YELLOW}📋 STEP 8: Set User Password${NC}"
echo -e "   ${BLUE}In user details → Credentials tab:${NC}\n"
echo -e "   • Click ${GREEN}'Set password'${NC}"
echo -e "   • Password: ${GREEN}Syndic123!${NC}"
echo -e "   • Temporary: ${RED}OFF${NC}"
echo -e "   • Click ${GREEN}'Save'${NC}\n"
read -p "Press Enter when password is set..."

# Step 9
echo -e "\n${YELLOW}📋 STEP 9: Assign Role${NC}"
echo -e "   ${BLUE}Create and assign realm role:${NC}\n"
echo -e "   1. Go to: ${GREEN}Realm roles → Create role${NC}"
echo -e "   2. Role name: ${GREEN}coproperty-syndic${NC}"
echo -e "   3. Click ${GREEN}'Save'${NC}"
echo -e "   4. Go back to: ${GREEN}Users → marie.dubois → Role mapping${NC}"
echo -e "   5. Click ${GREEN}'Assign role'${NC}"
echo -e "   6. Select ${GREEN}coproperty-syndic${NC}"
echo -e "   7. Click ${GREEN}'Assign'${NC}\n"
read -p "Press Enter when role is assigned..."

# Completion
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Configuration Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}🧪 Now test the fix:${NC}\n"
echo -e "1. Go back to your browser tab with ${GREEN}http://localhost:4201${NC}"
echo -e "2. ${RED}Hard refresh:${NC} Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo -e "3. Open DevTools Console (F12)"
echo -e "4. You should see: ${GREEN}'Keycloak authenticated: false'${NC}"
echo -e "5. Try to navigate to: ${GREEN}http://localhost:4201/coproperty/syndic${NC}"
echo -e "6. You'll be redirected to Keycloak login"
echo -e "7. Login with: ${GREEN}marie.dubois / Syndic123!${NC}"
echo -e "8. You should be redirected back without CORS errors!\n"

echo -e "${BLUE}📊 Check Console Logs:${NC}"
echo -e "You should see:"
echo -e "✅ ${GREEN}'Keycloak authenticated: true'${NC}"
echo -e "✅ ${GREEN}'User profile loaded successfully'${NC}"
echo -e "❌ ${RED}NO CORS errors${NC}\n"

echo -e "${YELLOW}💡 If CORS errors persist:${NC}"
echo -e "1. Verify Web origins is set to: ${GREEN}+${NC}"
echo -e "2. Make sure you clicked ${GREEN}Save${NC} in Keycloak"
echo -e "3. Try restarting Keycloak: ${GREEN}docker restart keycloak${NC}\n"

echo -e "${GREEN}Happy testing! 🚀${NC}\n"
