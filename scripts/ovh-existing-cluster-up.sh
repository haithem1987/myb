#!/usr/bin/env bash
################################################################################
# ovh-existing-cluster-up.sh - Scale an existing OVHcloud Kubernetes cluster up
#
# Usage:
#   ./scripts/ovh-existing-cluster-up.sh myb-coproperty-k8s --nodes 1
#
# Required env vars:
#   OVH_APPLICATION_KEY, OVH_APPLICATION_SECRET, OVH_CONSUMER_KEY
#
# Optional env vars:
#   OVH_ENDPOINT  ovh-ca | ovh-eu (default: ovh-ca)
#   SERVICE_NAME  OVH Public Cloud project ID. If omitted, hprd terraform.tfvars
#                 is used as the default project.
################################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

usage() {
  echo -e "${BOLD}Usage:${NC} $0 <cluster-name> [--nodes <count>]"
  echo "  cluster-name: existing OVH Kubernetes cluster name"
  echo "  --nodes     : desired worker nodes per nodepool (default: 1)"
  exit 1
}

CLUSTER_NAME="${1:-}"
[[ -z "$CLUSTER_NAME" ]] && usage

NODES=1
shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --nodes) NODES="${2:-}"; shift 2 ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; usage ;;
  esac
done

[[ "$NODES" =~ ^[0-9]+$ ]] || { echo -e "${RED}--nodes must be a number${NC}"; exit 1; }
[[ "$NODES" -gt 0 ]] || { echo -e "${RED}--nodes must be greater than 0${NC}"; exit 1; }

for var in OVH_APPLICATION_KEY OVH_APPLICATION_SECRET OVH_CONSUMER_KEY; do
  [[ -n "${!var:-}" ]] || { echo -e "${RED}Missing env var: $var${NC}"; exit 1; }
done

SERVICE_NAME="${SERVICE_NAME:-}"
if [[ -z "$SERVICE_NAME" ]]; then
  TFVARS="$PROJECT_ROOT/terraform/ovh/environments/hprd/terraform.tfvars"
  SERVICE_NAME="$(grep 'service_name' "$TFVARS" | awk -F'"' '{print $2}')"
fi

OVH_ENDPOINT_NAME="${OVH_ENDPOINT:-ovh-ca}"
case "$OVH_ENDPOINT_NAME" in
  ovh-ca) API_BASE="https://ca.api.ovh.com/1.0" ;;
  ovh-eu) API_BASE="https://eu.api.ovh.com/1.0" ;;
  *) echo -e "${RED}Unsupported OVH_ENDPOINT: $OVH_ENDPOINT_NAME${NC}"; exit 1 ;;
esac

ovh_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local url="${API_BASE}${path}"
  local ts sig_input digest signature

  ts="$(curl -sf "${API_BASE}/auth/time")"
  sig_input="${OVH_APPLICATION_SECRET}+${OVH_CONSUMER_KEY}+${method}+${url}+${body}+${ts}"
  digest="$(printf "%s" "$sig_input" | openssl dgst -sha1 -r | cut -d ' ' -f 1)"
  signature="\$1\$${digest}"

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

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  OVH Existing Cluster UP  [${BOLD}${CLUSTER_NAME}${NC}${GREEN}]${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Project     : ${BOLD}${SERVICE_NAME}${NC}"
echo -e "${BLUE}Endpoint    : ${BOLD}${OVH_ENDPOINT_NAME}${NC}"
echo -e "${BLUE}Nodes target: ${BOLD}${NODES}${NC}\n"

echo -e "${YELLOW}▶ Finding cluster ...${NC}"
CLUSTER_IDS="$(ovh_api GET "/cloud/project/${SERVICE_NAME}/kube")"
CLUSTER_ID=""

while IFS= read -r id; do
  [[ -n "$id" ]] || continue
  detail="$(ovh_api GET "/cloud/project/${SERVICE_NAME}/kube/${id}")"
  name="$(echo "$detail" | jq -r '.name')"
  status="$(echo "$detail" | jq -r '.status')"
  region="$(echo "$detail" | jq -r '.region')"
  echo -e "  ${BLUE}${name}${NC} [$id] status=${status} region=${region}"
  if [[ "$name" == "$CLUSTER_NAME" ]]; then
    CLUSTER_ID="$id"
  fi
done < <(echo "$CLUSTER_IDS" | jq -r '.[]')

if [[ -z "$CLUSTER_ID" ]]; then
  echo -e "\n${RED}Cluster not found: ${CLUSTER_NAME}${NC}"
  echo -e "${YELLOW}If it belongs to another Public Cloud project, rerun with SERVICE_NAME=<project-id>.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}▶ Fetching nodepools ...${NC}"
POOLS="$(ovh_api GET "/cloud/project/${SERVICE_NAME}/kube/${CLUSTER_ID}/nodepool")"
POOL_COUNT="$(echo "$POOLS" | jq 'length')"

if [[ "$POOL_COUNT" -eq 0 ]]; then
  echo -e "${RED}No nodepools found for ${CLUSTER_NAME}.${NC}"
  exit 1
fi

echo "$POOLS" | jq -r '.[] | "\(.id)|\(.name)|\(.desiredNodes // .desired_nodes // "unknown")|\(.status // "unknown")"' |
while IFS='|' read -r pool_id pool_name desired status; do
  echo -e "  ${BLUE}${pool_name}${NC} [$pool_id] desired=${desired} status=${status}"
  if [[ "$desired" == "$NODES" ]]; then
    echo -e "    ${GREEN}✓ already at ${NODES} node(s)${NC}"
  else
    echo -e "    ${YELLOW}▶ scaling to ${NODES} node(s) ...${NC}"
    ovh_api PUT "/cloud/project/${SERVICE_NAME}/kube/${CLUSTER_ID}/nodepool/${pool_id}" \
      "{\"desiredNodes\":${NODES}}" > /dev/null
    echo -e "    ${GREEN}✓ scale requested${NC}"
  fi
done

echo -e "\n${GREEN}✓ Scale-up requested for ${BOLD}${CLUSTER_NAME}${NC}"
echo -e "${YELLOW}  Wait 1-3 minutes, then run:${NC}"
echo -e "  kubectl --kubeconfig terraform/ovh/environments/hprd/kubeconfig-hprd.yml get nodes\n"
