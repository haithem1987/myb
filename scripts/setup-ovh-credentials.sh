#!/usr/bin/env bash
################################################################################
# setup-ovh-credentials.sh  –  Interactive setup for OVH API credentials
#
# Usage:
#   ./scripts/setup-ovh-credentials.sh
################################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

usage() {
  echo -e "${BOLD}Usage:${NC} $0 [--method <method>]"
  echo "  --method env      Store in .env file (simple)"
  echo "  --method envrc    Use .envrc with direnv (recommended)"
  echo "  --method keychain Use macOS Keychain (secure)"
  exit 1
}

METHOD="${1:-}"
if [[ "$METHOD" == "--method" ]]; then
  METHOD="${2:-env}"
else
  METHOD="env"
fi

# Validate method
case "$METHOD" in
  env|envrc|keychain) ;;
  *) echo -e "${RED}Unknown method: $METHOD${NC}"; usage ;;
esac

echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  OVH API Credentials Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Collect credentials
echo -e "\n${YELLOW}Enter your OVH API credentials:${NC}"
echo -e "${YELLOW}(Get from: https://api.ovh.com/createToken/)${NC}\n"

read -p "OVH Application Key: " OVH_APP_KEY
read -s -p "OVH Application Secret: " OVH_APP_SECRET
echo ""
read -s -p "OVH Consumer Key: " OVH_CONSUMER_KEY
echo ""

# Validate inputs
if [[ -z "$OVH_APP_KEY" || -z "$OVH_APP_SECRET" || -z "$OVH_CONSUMER_KEY" ]]; then
  echo -e "${RED}✗ All credentials are required${NC}"
  exit 1
fi

# Setup based on method
case "$METHOD" in
  env)
    echo -e "\n${YELLOW}▶ Creating .env file...${NC}"
    
    cat > "$PROJECT_ROOT/.env" << EOF
# OVH Credentials - NEVER commit this file
export OVH_APPLICATION_KEY="$OVH_APP_KEY"
export OVH_APPLICATION_SECRET="$OVH_APP_SECRET"
export OVH_CONSUMER_KEY="$OVH_CONSUMER_KEY"
export OVH_ENDPOINT="ovh-eu"
EOF
    
    chmod 600 "$PROJECT_ROOT/.env"
    
    echo -e "${GREEN}✓ Created: .env${NC}"
    echo -e "\n${YELLOW}To use credentials:${NC}"
    echo -e "  source .env"
    echo -e "  ./scripts/ovh-infra-status.sh prd"
    ;;

  envrc)
    # Check if direnv is installed
    if ! command -v direnv &>/dev/null; then
      echo -e "${RED}✗ direnv not found${NC}"
      echo -e "${YELLOW}Install with: brew install direnv${NC}"
      exit 1
    fi
    
    echo -e "\n${YELLOW}▶ Creating .envrc file...${NC}"
    
    cat > "$PROJECT_ROOT/.envrc" << EOF
# OVH Credentials - auto-loaded by direnv
# NEVER commit this file
export OVH_APPLICATION_KEY="$OVH_APP_KEY"
export OVH_APPLICATION_SECRET="$OVH_APP_SECRET"
export OVH_CONSUMER_KEY="$OVH_CONSUMER_KEY"
export OVH_ENDPOINT="ovh-eu"
EOF
    
    chmod 600 "$PROJECT_ROOT/.envrc"
    
    echo -e "${GREEN}✓ Created: .envrc${NC}"
    echo -e "\n${YELLOW}To enable:${NC}"
    echo -e "  cd $PROJECT_ROOT"
    echo -e "  direnv allow"
    echo -e "\n${GREEN}✓ Credentials auto-load when you cd into project!${NC}"
    ;;

  keychain)
    # macOS Keychain setup
    echo -e "\n${YELLOW}▶ Storing credentials in macOS Keychain...${NC}"
    
    security add-generic-password -a ovh_app_key -s OVH -w "$OVH_APP_KEY" -U 2>/dev/null || \
    security add-generic-password -U -a ovh_app_key -s OVH -w "$OVH_APP_KEY"
    
    security add-generic-password -a ovh_app_secret -s OVH -w "$OVH_APP_SECRET" -U 2>/dev/null || \
    security add-generic-password -U -a ovh_app_secret -s OVH -w "$OVH_APP_SECRET"
    
    security add-generic-password -a ovh_consumer_key -s OVH -w "$OVH_CONSUMER_KEY" -U 2>/dev/null || \
    security add-generic-password -U -a ovh_consumer_key -s OVH -w "$OVH_CONSUMER_KEY"
    
    echo -e "${GREEN}✓ Credentials stored in Keychain${NC}"
    
    # Create retrieval script
    mkdir -p ~/.config
    cat > ~/.config/ovh-creds.sh << 'EOF'
#!/bin/bash
export OVH_APPLICATION_KEY=$(security find-generic-password -a ovh_app_key -s OVH -w)
export OVH_APPLICATION_SECRET=$(security find-generic-password -a ovh_app_secret -s OVH -w)
export OVH_CONSUMER_KEY=$(security find-generic-password -a ovh_consumer_key -s OVH -w)
export OVH_ENDPOINT="ovh-eu"
EOF
    chmod +x ~/.config/ovh-creds.sh
    
    echo -e "\n${YELLOW}To use credentials:${NC}"
    echo -e "  source ~/.config/ovh-creds.sh"
    echo -e "  ./scripts/ovh-infra-status.sh prd"
    ;;
esac

# Test credentials
echo -e "\n${YELLOW}▶ Testing credentials...${NC}"

# Source the credentials
if [[ "$METHOD" == "env" ]]; then
  source "$PROJECT_ROOT/.env"
elif [[ "$METHOD" == "envrc" ]]; then
  cd "$PROJECT_ROOT"
  direnv allow &>/dev/null || true
  eval "$(direnv export bash)" 2>/dev/null || {
    echo -e "${YELLOW}Note: direnv may require shell hook setup${NC}"
    source "$PROJECT_ROOT/.envrc"
  }
else
  source ~/.config/ovh-creds.sh
fi

# Verify
if [[ -n "$OVH_APPLICATION_KEY" && -n "$OVH_APPLICATION_SECRET" && -n "$OVH_CONSUMER_KEY" ]]; then
  echo -e "${GREEN}✓ Credentials loaded successfully!${NC}"
  echo -e "\n${BLUE}Ready to use:${NC}"
  echo -e "  ./scripts/ovh-infra-status.sh prd"
  echo -e "  ./scripts/ovh-infra-down.sh prd --pause"
  echo -e "  ./scripts/ovh-infra-up.sh prd"
else
  echo -e "${RED}✗ Failed to load credentials${NC}"
  exit 1
fi

echo -e "\n${GREEN}✓ Setup complete!${NC}\n"
