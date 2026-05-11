#!/usr/bin/env bash
################################################################################
# ovh-infra-up.sh  –  Provision / scale up OVHcloud Kubernetes nodes
#
# Usage:
#   ./scripts/ovh-infra-up.sh prd          # bring up PRD cluster (2 nodes)
#   ./scripts/ovh-infra-up.sh hprd         # bring up HPRD cluster (1 node)
#   ./scripts/ovh-infra-up.sh prd --nodes 3  # custom node count
#
# Prerequisites:
#   - terraform >= 1.5
#   - OVH credentials exported:
#       OVH_APPLICATION_KEY, OVH_APPLICATION_SECRET, OVH_CONSUMER_KEY
#   - S3 credentials for state backend:
#       AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
################################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform/ovh/environments"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

usage() {
  echo -e "${BOLD}Usage:${NC} $0 <env> [--nodes <count>]"
  echo "  env    : prd | hprd"
  echo "  --nodes: override desired_nodes (optional)"
  exit 1
}

# ── Parse args ────────────────────────────────────────────────────────────────
ENV="${1:-}"
[[ -z "$ENV" ]] && usage
[[ "$ENV" != "prd" && "$ENV" != "hprd" ]] && { echo -e "${RED}Unknown env: $ENV${NC}"; usage; }

NODE_OVERRIDE=""
shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --nodes) NODE_OVERRIDE="${2:-}"; shift 2 ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; usage ;;
  esac
done

# Default node counts per environment
DEFAULT_NODES_PRD=2
DEFAULT_NODES_HPRD=1
[[ "$ENV" == "prd" ]]  && NODES="${NODE_OVERRIDE:-$DEFAULT_NODES_PRD}"
[[ "$ENV" == "hprd" ]] && NODES="${NODE_OVERRIDE:-$DEFAULT_NODES_HPRD}"

ENV_DIR="$TERRAFORM_DIR/$ENV"
ENV_UPPER=$(echo "$ENV" | tr '[:lower:]' '[:upper:]')

# ── Preflight checks ──────────────────────────────────────────────────────────
echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  MYB Platform - OVHcloud Infra UP  [${BOLD}${ENV_UPPER}${NC}${GREEN}]${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

for var in OVH_APPLICATION_KEY OVH_APPLICATION_SECRET OVH_CONSUMER_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo -e "${RED}✗ Missing env var: $var${NC}"
    echo -e "${YELLOW}  export OVH_APPLICATION_KEY=\"...\"${NC}"
    echo -e "${YELLOW}  export OVH_APPLICATION_SECRET=\"...\"${NC}"
    echo -e "${YELLOW}  export OVH_CONSUMER_KEY=\"...\"${NC}"
    exit 1
  fi
done

command -v terraform &>/dev/null || { echo -e "${RED}✗ terraform not found in PATH${NC}"; exit 1; }

echo -e "\n${BLUE}Environment : ${BOLD}${ENV_UPPER}${NC}"
echo -e "${BLUE}Nodes target: ${BOLD}${NODES}${NC}"
echo -e "${BLUE}Terraform dir: ${ENV_DIR}${NC}\n"

# ── Init ──────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}▶ terraform init ...${NC}"
terraform -chdir="$ENV_DIR" init -reconfigure

# ── Plan ──────────────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}▶ terraform plan ...${NC}"
terraform -chdir="$ENV_DIR" plan -var="desired_nodes=${NODES}" -out=/tmp/myb-${ENV}-up.tfplan

# ── Confirm ───────────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}Apply the plan above to ${BOLD}${ENV_UPPER}${NC}${YELLOW}? [y/N]${NC} "
read -r CONFIRM
[[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { echo -e "${YELLOW}Aborted.${NC}"; exit 0; }

# ── Apply ─────────────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}▶ terraform apply ...${NC}"
terraform -chdir="$ENV_DIR" apply /tmp/myb-${ENV}-up.tfplan

# ── Export kubeconfig ─────────────────────────────────────────────────────────
KUBECONFIG_PATH="$ENV_DIR/kubeconfig-${ENV}.yml"
if [[ -f "$KUBECONFIG_PATH" ]]; then
  echo -e "\n${GREEN}✓ Kubeconfig saved to: ${KUBECONFIG_PATH}${NC}"
  echo -e "${YELLOW}  To use: export KUBECONFIG=${KUBECONFIG_PATH}${NC}"
else
  echo -e "\n${YELLOW}⚠ Run 'terraform output -raw kubeconfig' to get kubeconfig manually${NC}"
fi

echo -e "\n${GREEN}✓ Infra UP complete for ${BOLD}${ENV_UPPER}${NC}"
echo -e "${YELLOW}  Next: ./scripts/ovh-deploy.sh ${ENV}${NC}\n"
