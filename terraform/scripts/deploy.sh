#!/usr/bin/env bash
# ==============================================================================
# MYB Platform - Deploy/Update ECS Services
# Usage: ./deploy.sh <environment> [service_name]
# Triggers a new deployment of the specified service (or all services)
# ==============================================================================

set -euo pipefail

ENVIRONMENT="${1:?Usage: $0 <dev|staging|prod> [service_name]}"
SERVICE_NAME="${2:-all}"
AWS_REGION="${AWS_REGION:-eu-west-3}"
PROJECT_NAME="${PROJECT_NAME:-myb}"
CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"; }

# Phase 1 (Coproperty): 6 services. Phase 2 will add: timesheet, invoice, document, payment
SERVICES=(
  "keycloak"
  "user-manager"
  "coproperty"
  "notification"
  "mailer"
  "admin"
)

deploy_service() {
  local svc="$1"
  log "Deploying ${svc} in cluster ${CLUSTER_NAME}..."

  aws ecs update-service \
    --cluster "${CLUSTER_NAME}" \
    --service "${svc}" \
    --force-new-deployment \
    --region "${AWS_REGION}" \
    --output text > /dev/null

  log "✓ ${svc} deployment triggered"
}

if [[ "${SERVICE_NAME}" == "all" ]]; then
  log "Deploying ALL services to ${ENVIRONMENT}..."
  for svc in "${SERVICES[@]}"; do
    deploy_service "${svc}"
  done
else
  deploy_service "${SERVICE_NAME}"
fi

log ""
log "Deployments triggered. Monitor progress:"
log "  aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --query 'services[].deployments' --region ${AWS_REGION}"
log ""
log "Or watch logs:"
log "  aws logs tail /ecs/${PROJECT_NAME}-${ENVIRONMENT}/${SERVICE_NAME} --follow --region ${AWS_REGION}"
