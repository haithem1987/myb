#!/usr/bin/env bash
################################################################################
# ovh-infra-down.sh  –  Scale down / destroy OVHcloud Kubernetes nodes
#
# Two modes:
#   --pause    (default) Scale node pool to 0 – cluster stays, no worker cost
#   --destroy  Full terraform destroy – removes cluster entirely (max savings)
#
# Usage:
#   ./scripts/ovh-infra-down.sh prd           # pause PRD (nodes=0)
#   ./scripts/ovh-infra-down.sh hprd          # pause HPRD (nodes=0)
#   ./scripts/ovh-infra-down.sh prd --destroy # destroy PRD cluster entirely
#   ./scripts/ovh-infra-down.sh hprd --destroy
################################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform/ovh/environments"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

usage() {
  echo -e "${BOLD}Usage:${NC} $0 <env> [--pause|--destroy]"
  echo "  env       : prd | hprd"
  echo "  --pause   : scale nodes to 0 (default, cheapest while keeping cluster)"
  echo "  --destroy : full terraform destroy (maximum savings, slower to restore)"
  exit 1
}

ENV="${1:-}"
[[ -z "$ENV" ]] && usage
[[ "$ENV" != "prd" && "$ENV" != "hprd" ]] && { echo -e "${RED}Unknown env: $ENV${NC}"; usage; }

MODE="pause"
shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pause)   MODE="pause";   shift ;;
    --destroy) MODE="destroy"; shift ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; usage ;;
  esac
done

ENV_DIR="$TERRAFORM_DIR/$ENV"
ENV_UPPER=$(echo "$ENV" | tr '[:lower:]' '[:upper:]')
MODE_UPPER=$(echo "$MODE" | tr '[:lower:]' '[:upper:]')

echo -e "\n${RED}═══════════════════════════════════════════════════${NC}"
echo -e "${RED}  MYB Platform - OVHcloud Infra DOWN  [${BOLD}${ENV_UPPER}${NC}${RED}]  Mode: ${MODE_UPPER}${NC}"
echo -e "${RED}═══════════════════════════════════════════════════${NC}"

for var in OVH_APPLICATION_KEY OVH_APPLICATION_SECRET OVH_CONSUMER_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo -e "${RED}✗ Missing env var: $var${NC}"; exit 1
  fi
done

command -v terraform &>/dev/null || { echo -e "${RED}✗ terraform not found${NC}"; exit 1; }

echo -e "\n${BLUE}Environment: ${BOLD}${ENV_UPPER}${NC}"
echo -e "${BLUE}Mode       : ${BOLD}${MODE}${NC}\n"

terraform -chdir="$ENV_DIR" init -reconfigure

if [[ "$MODE" == "pause" ]]; then
  # ── Pause: scale nodes to 0 (fastest, cluster control plane stays) ──────────
  echo -e "${YELLOW}▶ terraform plan (desired_nodes=0) ...${NC}"
  terraform -chdir="$ENV_DIR" plan -var="desired_nodes=0" -out=/tmp/myb-${ENV}-down.tfplan

  echo -e "\n${YELLOW}This will scale ${BOLD}${ENV_UPPER}${NC}${YELLOW} node pool to 0 workers."
  echo -e "Cluster stays alive; workloads will be evicted. Continue? [y/N]${NC} "
  read -r CONFIRM
  [[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { echo -e "${YELLOW}Aborted.${NC}"; exit 0; }

  terraform -chdir="$ENV_DIR" apply /tmp/myb-${ENV}-down.tfplan
  echo -e "\n${GREEN}✓ ${ENV_UPPER} node pool paused (0 workers).${NC}"
  echo -e "${YELLOW}  Workers stopped → worker billing stopped.${NC}"
  echo -e "${YELLOW}  To restore: ./scripts/ovh-infra-up.sh ${ENV}${NC}\n"

else
  # ── Destroy: remove entire cluster ─────────────────────────────────────────
  echo -e "\n${RED}⚠ WARNING: This will DESTROY the entire ${BOLD}${ENV_UPPER}${NC}${RED} cluster!${NC}"
  echo -e "${RED}  All data on local volumes will be LOST.${NC}"
  echo -e "${RED}  Type '${ENV}-destroy' to confirm: ${NC}"
  read -r CONFIRM
  [[ "$CONFIRM" != "${ENV}-destroy" ]] && { echo -e "${YELLOW}Aborted.${NC}"; exit 0; }

  terraform -chdir="$ENV_DIR" destroy -var="desired_nodes=0" -auto-approve
  echo -e "\n${GREEN}✓ ${ENV_UPPER} cluster destroyed.${NC}"
  echo -e "${YELLOW}  To recreate: ./scripts/ovh-infra-up.sh ${ENV}${NC}\n"
fi
