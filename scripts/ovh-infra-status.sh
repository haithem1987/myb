#!/usr/bin/env bash
################################################################################
# ovh-infra-status.sh  –  Check OVHcloud infrastructure status & costs
#
# Usage:
#   ./scripts/ovh-infra-status.sh prd   # check PRD status
#   ./scripts/ovh-infra-status.sh hprd  # check HPRD status
#   ./scripts/ovh-infra-status.sh       # check all environments
################################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform/ovh/environments"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

usage() {
  echo -e "${BOLD}Usage:${NC} $0 [env]"
  echo "  env : prd | hprd (optional, shows all if omitted)"
  exit 1
}

ENV="${1:-all}"
[[ "$ENV" != "prd" && "$ENV" != "hprd" && "$ENV" != "all" ]] && usage

check_credentials() {
  for var in OVH_APPLICATION_KEY OVH_APPLICATION_SECRET OVH_CONSUMER_KEY; do
    if [[ -z "${!var:-}" ]]; then
      return 1
    fi
  done
  return 0
}

check_env_status() {
  local env="$1"
  local env_upper=$(echo "$env" | tr '[:lower:]' '[:upper:]')
  local env_dir="$TERRAFORM_DIR/$env"

  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Environment: ${BOLD}${env_upper}${NC}${BLUE}${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  if [[ ! -d "$env_dir" ]]; then
    echo -e "${RED}✗ Environment directory not found: $env_dir${NC}"
    return
  fi

  if [[ ! -f "$env_dir/terraform.tfstate" ]]; then
    echo -e "${YELLOW}⚠ No terraform state found (not yet initialized)${NC}"
    return
  fi

  echo -e "${YELLOW}State file:${NC} $env_dir/terraform.tfstate"
  
  # Extract current node count from state
  local current_nodes=$(terraform -chdir="$env_dir" show -json 2>/dev/null | grep -o '"desired_nodes"[^,]*' | head -1 || echo '"desired_nodes": <unknown>')
  echo -e "${YELLOW}Current nodes: ${NC}${current_nodes}"

  # Show outputs if terraform is initialized
  if terraform -chdir="$env_dir" state list 2>/dev/null | grep -q .; then
    echo -e "\n${YELLOW}Outputs:${NC}"
    terraform -chdir="$env_dir" output 2>/dev/null | sed 's/^/  /'
  fi
}

# Main

echo -e "\n${BOLD}OVHcloud Infrastructure Status${NC}"

if ! check_credentials; then
  echo -e "${RED}✗ Missing OVH credentials!${NC}"
  echo -e "${YELLOW}  Set these env vars:${NC}"
  echo -e "    export OVH_APPLICATION_KEY=\"...\""
  echo -e "    export OVH_APPLICATION_SECRET=\"...\""
  echo -e "    export OVH_CONSUMER_KEY=\"...\""
  echo -e "    export OVH_ENDPOINT=\"ovh-eu\""
  echo -e "\n${YELLOW}  See: docs/OVH_CREDENTIALS_SETUP.md${NC}"
  exit 1
fi

if [[ "$ENV" == "all" ]]; then
  check_env_status "prd"
  check_env_status "hprd"
else
  check_env_status "$ENV"
fi

echo -e "\n${GREEN}Quick Reference:${NC}"
echo -e "  Pause (stop costs):    ./scripts/ovh-infra-down.sh prd --pause"
echo -e "  Resume:                ./scripts/ovh-infra-up.sh prd"
echo -e "  Destroy (max savings): ./scripts/ovh-infra-down.sh prd --destroy"
echo -e ""
