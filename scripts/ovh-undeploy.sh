#!/usr/bin/env bash
################################################################################
# ovh-undeploy.sh  –  Remove MYB workloads from OVHcloud Kubernetes
#
# Deletes all pods, services, and ingress for a given environment.
# Does NOT touch the cluster nodes (use ovh-infra-down.sh for that).
#
# Usage:
#   ./scripts/ovh-undeploy.sh prd           # remove PRD workloads
#   ./scripts/ovh-undeploy.sh hprd          # remove HPRD workloads
#   ./scripts/ovh-undeploy.sh prd --helm    # use Helm uninstall
#   ./scripts/ovh-undeploy.sh prd --all     # also delete namespace
################################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
K8S_DIR="$PROJECT_ROOT/ovhcloud/k8s"
HELM_DIR="$PROJECT_ROOT/ovhcloud/helm/myb-platform"
TF_ENV_DIR="$PROJECT_ROOT/terraform/ovh/environments"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

usage() {
  echo -e "${BOLD}Usage:${NC} $0 <env> [--helm] [--all]"
  echo "  env    : prd | hprd"
  echo "  --helm : use Helm uninstall (default: kustomize delete)"
  echo "  --all  : also delete the namespace (removes everything)"
  exit 1
}

ENV="${1:-}"; [[ -z "$ENV" ]] && usage
[[ "$ENV" != "prd" && "$ENV" != "hprd" ]] && { echo -e "${RED}Unknown env: $ENV${NC}"; usage; }

USE_HELM=false; DELETE_NS=false
shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --helm) USE_HELM=true;  shift ;;
    --all)  DELETE_NS=true; shift ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; usage ;;
  esac
done

NS="myb-${ENV}"
ENV_UPPER=$(echo "$ENV" | tr '[:lower:]' '[:upper:]')

echo -e "\n${RED}═══════════════════════════════════════════════════${NC}"
echo -e "${RED}  MYB Platform - UNDEPLOY Workloads  [${BOLD}${ENV_UPPER}${NC}${RED}]${NC}"
[[ "$DELETE_NS" == "true" ]] && echo -e "${RED}  ⚠ Namespace ${NS} will also be DELETED${NC}"
echo -e "${RED}═══════════════════════════════════════════════════${NC}"

# ── Auto-set KUBECONFIG from terraform if not already set ─────────────────────
KUBECONFIG_PATH="$TF_ENV_DIR/$ENV/kubeconfig-${ENV}.yml"
if [[ -z "${KUBECONFIG:-}" && -f "$KUBECONFIG_PATH" ]]; then
  export KUBECONFIG="$KUBECONFIG_PATH"
  echo -e "${BLUE}Using kubeconfig: ${KUBECONFIG_PATH}${NC}"
fi

command -v kubectl &>/dev/null || { echo -e "${RED}✗ kubectl not found${NC}"; exit 1; }

echo -e "\n${YELLOW}This will remove all workloads from ${BOLD}${NS}${NC}${YELLOW}."
echo -e "Nodes are NOT affected (use ovh-infra-down.sh to stop nodes)."
echo -e "Continue? [y/N] ${NC}"
read -r CONFIRM
[[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { echo "Aborted."; exit 0; }

if [[ "$USE_HELM" == "true" ]]; then
  command -v helm &>/dev/null || { echo -e "${RED}✗ helm not found${NC}"; exit 1; }
  echo -e "\n${YELLOW}▶ helm uninstall myb-${ENV} ...${NC}"
  helm uninstall "myb-${ENV}" --namespace "$NS" 2>/dev/null || echo -e "${YELLOW}  (release not found, skipping)${NC}"
else
  OVERLAY_DIR="$K8S_DIR/environments/$ENV"
  echo -e "\n${YELLOW}▶ kubectl delete -k (kustomize) ...${NC}"
  kubectl delete -k "$OVERLAY_DIR" --ignore-not-found=true
fi

if [[ "$DELETE_NS" == "true" ]]; then
  echo -e "\n${RED}▶ Deleting namespace ${NS} ...${NC}"
  kubectl delete namespace "$NS" --ignore-not-found=true
fi

echo -e "\n${GREEN}✓ Workloads removed from ${BOLD}${ENV_UPPER}${NC}"
echo -e "${YELLOW}  Nodes are still running. To stop billing for nodes:${NC}"
echo -e "${YELLOW}  ./scripts/ovh-infra-down.sh ${ENV}${NC}\n"
