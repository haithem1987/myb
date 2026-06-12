#!/usr/bin/env bash
################################################################################
# ovh-infra-down.sh  –  Scale down / destroy OVHcloud Kubernetes clusters
#
# Two modes:
#   --pause    (default) Scale ALL node pools to 0 – cluster stays, no worker cost
#   --destroy  Delete ALL clusters under the project entirely (max savings)
#
# Strategy:
#   1. Try Terraform (for infra created via Terraform)
#   2. If Terraform state is empty, fall back to OVH REST API directly
#      (handles clusters created manually via OVH console)
#
# Usage:
#   ./scripts/ovh-infra-down.sh prd           # pause PRD (nodes=0)
#   ./scripts/ovh-infra-down.sh hprd          # pause HPRD (nodes=0)
#   ./scripts/ovh-infra-down.sh prd --destroy # destroy all PRD clusters
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
  echo "  --destroy : delete all clusters entirely (maximum savings, slower to restore)"
  exit 1
}

# ── Parse args ─────────────────────────────────────────────────────────────────
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

# ── Preflight checks ───────────────────────────────────────────────────────────
for var in OVH_APPLICATION_KEY OVH_APPLICATION_SECRET OVH_CONSUMER_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo -e "${RED}✗ Missing env var: $var${NC}"; exit 1
  fi
done
command -v curl    &>/dev/null || { echo -e "${RED}✗ curl not found${NC}"; exit 1; }
command -v openssl &>/dev/null || { echo -e "${RED}✗ openssl not found${NC}"; exit 1; }
command -v jq      &>/dev/null || { echo -e "${RED}✗ jq not found (brew install jq)${NC}"; exit 1; }

# ── Read project config from tfvars ───────────────────────────────────────────
TFVARS="$ENV_DIR/terraform.tfvars"
SERVICE_NAME=$(grep 'service_name' "$TFVARS" | awk -F'"' '{print $2}')
OVH_ENDPOINT_NAME=$(grep 'ovh_endpoint' "$TFVARS" | awk -F'"' '{print $2}')

case "$OVH_ENDPOINT_NAME" in
  ovh-ca) API_BASE="https://ca.api.ovh.com/1.0" ;;
  ovh-eu) API_BASE="https://eu.api.ovh.com/1.0" ;;
  *)      API_BASE="https://ca.api.ovh.com/1.0" ;;
esac

echo -e "\n${BLUE}Environment : ${BOLD}${ENV_UPPER}${NC}"
echo -e "${BLUE}Mode        : ${BOLD}${MODE}${NC}"
echo -e "${BLUE}Project     : ${BOLD}${SERVICE_NAME}${NC}"
echo -e "${BLUE}API endpoint: ${BOLD}${API_BASE}${NC}\n"

# ── OVH REST API helper (HMAC-SHA1 signed) ─────────────────────────────────────
# Usage: ovh_api <METHOD> <path> [json_body]
ovh_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local url="${API_BASE}${path}"

  # Sync timestamp with OVH server to avoid clock-skew errors
  local ts
  ts=$(curl -sf "${API_BASE}/auth/time" || date +%s)

  local sig_input="${OVH_APPLICATION_SECRET}+${OVH_CONSUMER_KEY}+${method}+${url}+${body}+${ts}"
  local signature="\$1\$$(echo -n "$sig_input" | openssl dgst -sha1 | awk '{print $NF}')"

  if [[ -n "$body" ]]; then
    curl -sf -X "$method" \
      -H "Content-Type: application/json" \
      -H "X-Ovh-Application: ${OVH_APPLICATION_KEY}" \
      -H "X-Ovh-Consumer: ${OVH_CONSUMER_KEY}" \
      -H "X-Ovh-Timestamp: ${ts}" \
      -H "X-Ovh-Signature: ${signature}" \
      -d "$body" \
      "$url"
  else
    curl -sf -X "$method" \
      -H "Content-Type: application/json" \
      -H "X-Ovh-Application: ${OVH_APPLICATION_KEY}" \
      -H "X-Ovh-Consumer: ${OVH_CONSUMER_KEY}" \
      -H "X-Ovh-Timestamp: ${ts}" \
      -H "X-Ovh-Signature: ${signature}" \
      "$url"
  fi
}

# ── List all Kubernetes clusters in the project (returns full detail JSON array) ─
list_clusters() {
  # GET /kube returns an array of cluster IDs (strings), not objects.
  # We fetch detail for each ID and merge into an array.
  local ids
  ids=$(ovh_api GET "/cloud/project/${SERVICE_NAME}/kube")
  echo "$ids" | jq -r '.[]' | while IFS= read -r cid; do
    ovh_api GET "/cloud/project/${SERVICE_NAME}/kube/${cid}"
  done | jq -s '.'
}

# ── Pause: scale all node pools of a cluster to 0 ────────────────────────────
api_pause_cluster() {
  local cluster_id="$1"
  local cluster_name="$2"

  echo -e "  ${BLUE}Fetching node pools for cluster ${BOLD}${cluster_name}${NC}..."
  local pools
  pools=$(ovh_api GET "/cloud/project/${SERVICE_NAME}/kube/${cluster_id}/nodepool")
  local pool_ids
  pool_ids=$(echo "$pools" | jq -r '.[].id')

  if [[ -z "$pool_ids" ]]; then
    echo -e "  ${YELLOW}No node pools found for ${cluster_name}.${NC}"
    return
  fi

  while IFS= read -r pool_id; do
    local pool_name
    pool_name=$(echo "$pools" | jq -r --arg id "$pool_id" '.[] | select(.id==$id) | .name')
    local desired
    desired=$(echo "$pools" | jq -r --arg id "$pool_id" '.[] | select(.id==$id) | .desiredNodes')

    if [[ "$desired" == "0" ]]; then
      echo -e "  ${GREEN}✓ Pool ${BOLD}${pool_name}${NC}${GREEN} already at 0 nodes.${NC}"
    else
      echo -e "  ${YELLOW}▶ Scaling pool ${BOLD}${pool_name}${NC}${YELLOW} from ${desired} → 0 nodes...${NC}"
      ovh_api PUT "/cloud/project/${SERVICE_NAME}/kube/${cluster_id}/nodepool/${pool_id}" \
        '{"desiredNodes":0}' > /dev/null
      echo -e "  ${GREEN}✓ Pool ${BOLD}${pool_name}${NC}${GREEN} scaled to 0. Worker billing stopped.${NC}"
    fi
  done <<< "$pool_ids"
}

# ── Destroy: delete entire cluster ───────────────────────────────────────────
api_destroy_cluster() {
  local cluster_id="$1"
  local cluster_name="$2"

  echo -e "  ${RED}▶ Deleting cluster ${BOLD}${cluster_name}${NC}${RED} (${cluster_id})...${NC}"
  ovh_api DELETE "/cloud/project/${SERVICE_NAME}/kube/${cluster_id}" > /dev/null
  echo -e "  ${GREEN}✓ Cluster ${BOLD}${cluster_name}${NC}${GREEN} deletion initiated.${NC}"
  echo -e "  ${YELLOW}  (OVH deletes asynchronously — may take 1-2 min to fully disappear)${NC}"
}

# ── Terraform path (for infra managed by Terraform) ───────────────────────────
TF_MANAGED=false
if command -v terraform &>/dev/null; then
  terraform -chdir="$ENV_DIR" init -reconfigure -input=false > /dev/null 2>&1
  TF_STATE_RESOURCES=$(terraform -chdir="$ENV_DIR" state list 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$TF_STATE_RESOURCES" -gt 0 ]]; then
    TF_MANAGED=true
    echo -e "${BLUE}▶ Found ${TF_STATE_RESOURCES} Terraform-managed resource(s). Using Terraform path.${NC}\n"
  else
    echo -e "${YELLOW}⚠ Terraform state is empty. Falling back to OVH API (handles manually-created clusters).${NC}\n"
  fi
fi

if [[ "$TF_MANAGED" == "true" ]]; then
  # ── Terraform-managed path ─────────────────────────────────────────────────
  if [[ "$MODE" == "pause" ]]; then
    echo -e "${YELLOW}▶ terraform plan (desired_nodes=0) ...${NC}"
    terraform -chdir="$ENV_DIR" plan -var="desired_nodes=0" -out=/tmp/myb-${ENV}-down.tfplan

    echo -e "\n${YELLOW}This will scale ${BOLD}${ENV_UPPER}${NC}${YELLOW} node pool to 0 workers."
    echo -e "Cluster stays alive; workloads will be evicted. Continue? [y/N]${NC} "
    read -r CONFIRM
    [[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { echo -e "${YELLOW}Aborted.${NC}"; exit 0; }

    terraform -chdir="$ENV_DIR" apply /tmp/myb-${ENV}-down.tfplan
    echo -e "\n${GREEN}✓ ${ENV_UPPER} node pool paused (0 workers).${NC}"
    echo -e "${YELLOW}  To restore: ./scripts/ovh-infra-up.sh ${ENV}${NC}\n"
  else
    echo -e "\n${RED}⚠ WARNING: This will DESTROY the entire ${BOLD}${ENV_UPPER}${NC}${RED} Terraform-managed cluster!${NC}"
    echo -e "${RED}  Type '${ENV}-destroy' to confirm: ${NC}"
    read -r CONFIRM
    [[ "$CONFIRM" != "${ENV}-destroy" ]] && { echo -e "${YELLOW}Aborted.${NC}"; exit 0; }

    terraform -chdir="$ENV_DIR" destroy -var="desired_nodes=0" -auto-approve
    echo -e "\n${GREEN}✓ ${ENV_UPPER} cluster destroyed.${NC}"
    echo -e "${YELLOW}  To recreate: ./scripts/ovh-infra-up.sh ${ENV}${NC}\n"
  fi

else
  # ── OVH API fallback path (handles manually-created or out-of-state clusters) ─
  echo -e "${BLUE}▶ Querying OVH API for Kubernetes clusters in project ${SERVICE_NAME}...${NC}"
  CLUSTERS_JSON=$(list_clusters)
  CLUSTER_COUNT=$(echo "$CLUSTERS_JSON" | jq 'length')

  if [[ "$CLUSTER_COUNT" -eq 0 ]]; then
    echo -e "${GREEN}✓ No Kubernetes clusters found in this project. Nothing to do.${NC}\n"
    exit 0
  fi

  echo -e "${YELLOW}Found ${BOLD}${CLUSTER_COUNT}${NC}${YELLOW} cluster(s):${NC}"
  echo "$CLUSTERS_JSON" | jq -r '.[] | "  • \(.name)  [\(.id)]  status=\(.status)  version=\(.version)"'
  echo ""

  if [[ "$MODE" == "pause" ]]; then
    echo -e "${YELLOW}This will scale ALL node pools to 0 workers (clusters stay alive)."
    echo -e "Worker billing stops. Continue? [y/N]${NC} "
    read -r CONFIRM
    [[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { echo -e "${YELLOW}Aborted.${NC}"; exit 0; }

    while IFS= read -r row; do
      cluster_id=$(echo "$row" | cut -d'|' -f1)
      cluster_name=$(echo "$row" | cut -d'|' -f2)
      echo -e "\n${BLUE}Processing cluster: ${BOLD}${cluster_name}${NC}"
      api_pause_cluster "$cluster_id" "$cluster_name"
    done < <(echo "$CLUSTERS_JSON" | jq -r '.[] | "\(.id)|\(.name)"')

    echo -e "\n${GREEN}✓ All node pools scaled to 0. Worker billing stopped.${NC}"
    echo -e "${YELLOW}  To restore: ./scripts/ovh-infra-up.sh ${ENV}${NC}\n"

  else
    echo -e "${RED}⚠ WARNING: This will DELETE all ${CLUSTER_COUNT} cluster(s) listed above!${NC}"
    echo -e "${RED}  All workloads and local volumes will be LOST.${NC}"
    echo -e "${RED}  Type '${ENV}-destroy' to confirm: ${NC}"
    read -r CONFIRM
    [[ "$CONFIRM" != "${ENV}-destroy" ]] && { echo -e "${YELLOW}Aborted.${NC}"; exit 0; }

    while IFS= read -r row; do
      cluster_id=$(echo "$row" | cut -d'|' -f1)
      cluster_name=$(echo "$row" | cut -d'|' -f2)
      echo ""
      api_destroy_cluster "$cluster_id" "$cluster_name"
    done < <(echo "$CLUSTERS_JSON" | jq -r '.[] | "\(.id)|\(.name)"')

    echo -e "\n${GREEN}✓ All clusters deleted. Billing will stop once OVH finishes cleanup.${NC}"
    echo -e "${YELLOW}  To recreate: ./scripts/ovh-infra-up.sh ${ENV}${NC}\n"
  fi
fi
