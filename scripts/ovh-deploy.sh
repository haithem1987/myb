#!/usr/bin/env bash
################################################################################
# ovh-deploy.sh  –  Deploy MYB workloads to OVHcloud Kubernetes
#
# Deploys all pods, services, and ingress for a given environment using
# kustomize (built into kubectl) or Helm.
#
# Usage:
#   ./scripts/ovh-deploy.sh prd           # deploy to PRD (namespace: myb-prd)
#   ./scripts/ovh-deploy.sh hprd          # deploy to HPRD (namespace: myb-hprd)
#   ./scripts/ovh-deploy.sh prd --helm    # use Helm instead of kustomize
#   ./scripts/ovh-deploy.sh hprd --helm
#
# Prerequisites:
#   - kubectl configured (KUBECONFIG pointing to the right cluster)
#   - OR: automatically picks kubeconfig from terraform output
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
  echo -e "${BOLD}Usage:${NC} $0 <env> [--helm] [--dry-run]"
  echo "  env       : prd | hprd"
  echo "  --helm    : use Helm (default: kustomize)"
  echo "  --dry-run : preview without applying"
  exit 1
}

ENV="${1:-}"; [[ -z "$ENV" ]] && usage
[[ "$ENV" != "prd" && "$ENV" != "hprd" ]] && { echo -e "${RED}Unknown env: $ENV${NC}"; usage; }

USE_HELM=false; DRY_RUN=false
shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --helm)    USE_HELM=true;  shift ;;
    --dry-run) DRY_RUN=true;   shift ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; usage ;;
  esac
done

NS="myb-${ENV}"
ENV_UPPER=$(echo "$ENV" | tr '[:lower:]' '[:upper:]')

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  MYB Platform - Deploy Workloads  [${BOLD}${ENV_UPPER}${NC}${GREEN}]${NC}"
[[ "$DRY_RUN" == "true" ]] && echo -e "${YELLOW}  DRY-RUN MODE – no changes applied${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

# ── Auto-set KUBECONFIG from terraform if not already set ────────────────────
KUBECONFIG_PATH="$TF_ENV_DIR/$ENV/kubeconfig-${ENV}.yml"
if [[ -z "${KUBECONFIG:-}" && -f "$KUBECONFIG_PATH" ]]; then
  export KUBECONFIG="$KUBECONFIG_PATH"
  echo -e "${BLUE}Using kubeconfig: ${KUBECONFIG_PATH}${NC}"
fi

command -v kubectl &>/dev/null || { echo -e "${RED}✗ kubectl not found${NC}"; exit 1; }
kubectl cluster-info &>/dev/null || { echo -e "${RED}✗ Cannot reach cluster. Check KUBECONFIG.${NC}"; exit 1; }

echo -e "\n${BLUE}Cluster:   $(kubectl config current-context)${NC}"
echo -e "${BLUE}Namespace: ${BOLD}${NS}${NC}"
echo -e "${BLUE}Method:    $([ "$USE_HELM" == "true" ] && echo "Helm" || echo "Kustomize")${NC}\n"

[[ "$DRY_RUN" != "true" ]] && echo -e "${YELLOW}Deploy to ${BOLD}${ENV_UPPER}${NC}${YELLOW}? [y/N] ${NC}" && read -r CONFIRM
[[ "${CONFIRM:-y}" != "y" && "${CONFIRM:-y}" != "Y" ]] && { echo "Aborted."; exit 0; }

KUBECTL_ARGS=""
[[ "$DRY_RUN" == "true" ]] && KUBECTL_ARGS="--dry-run=client"

if [[ "$USE_HELM" == "true" ]]; then
  # ── Helm deployment ────────────────────────────────────────────────────────
  command -v helm &>/dev/null || { echo -e "${RED}✗ helm not found${NC}"; exit 1; }

  echo -e "${YELLOW}▶ helm upgrade --install myb-${ENV} ...${NC}"
  HELM_CMD=(
    helm upgrade --install "myb-${ENV}" "$HELM_DIR"
    --namespace "$NS" --create-namespace
    -f "$HELM_DIR/values-${ENV}.yaml"
  )
  [[ "$DRY_RUN" == "true" ]] && HELM_CMD+=(--dry-run)
  "${HELM_CMD[@]}"

else
  # ── Kustomize deployment ───────────────────────────────────────────────────
  OVERLAY_DIR="$K8S_DIR/environments/$ENV"

  echo -e "${YELLOW}▶ kubectl apply -k (kustomize) ...${NC}"
  kubectl apply -k "$OVERLAY_DIR" $KUBECTL_ARGS

  # Wait for critical deployments
  if [[ "$DRY_RUN" != "true" ]]; then
    echo -e "\n${YELLOW}▶ Waiting for deployments to become ready ...${NC}"
    for svc in keycloak rabbitmq myb-coproperty myb-invoice myb-admin myb-client; do
      echo -ne "  ${BLUE}${svc}${NC} ... "
      if kubectl rollout status deployment/$svc -n "$NS" --timeout=180s 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
      else
        echo -e "${YELLOW}⚠ still rolling out${NC}"
      fi
    done
  fi
fi

echo -e "\n${GREEN}✓ Deploy complete for ${BOLD}${ENV_UPPER}${NC}"
if [[ "$DRY_RUN" != "true" ]]; then
  echo -e "\n${BLUE}Services:${NC}"
  kubectl get svc -n "$NS" 2>/dev/null || true
  echo -e "\n${BLUE}Ingress:${NC}"
  kubectl get ingress -n "$NS" 2>/dev/null || true
fi
echo ""
