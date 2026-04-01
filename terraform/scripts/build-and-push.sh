#!/usr/bin/env bash
# ==============================================================================
# MYB Platform - Build and Push Docker Images to ECR
# Usage: ./build-and-push.sh <environment> [service_name]
# Examples:
#   ./build-and-push.sh dev              # Build and push ALL services
#   ./build-and-push.sh dev user-manager # Build and push only user-manager
# ==============================================================================

set -euo pipefail

ENVIRONMENT="${1:?Usage: $0 <dev|staging|prod> [service_name]}"
SERVICE_NAME="${2:-all}"
AWS_REGION="${AWS_REGION:-eu-west-3}"
PROJECT_NAME="${PROJECT_NAME:-myb}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || error "AWS credentials not configured. Run 'aws configure' first."
ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}"

log "AWS Account: ${AWS_ACCOUNT_ID}"
log "ECR Base: ${ECR_BASE}"
log "Environment: ${ENVIRONMENT}"

# Authenticate Docker with ECR
log "Authenticating Docker with ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Phase 1 (Coproperty): 6 services only
# Phase 2 will add: timesheet, invoice, document, payment
declare -A SERVICES=(
  ["user-manager"]="src/services/user-manager/Myb.UserManager/Dockerfile"
  ["notification"]="src/services/notification-service/Myb.Notification/Dockerfile"
  ["mailer"]="src/services/mailer-service/Myb.Mailer/Dockerfile"
  ["coproperty"]="src/services/coproperty-management/Myb.Coproperty/Dockerfile"
  ["keycloak"]="Dockerfile.keycloak"
  ["admin"]="Dockerfile.frontend"   # Admin Angular app (NX build), context = repo root
)

build_and_push() {
  local svc_name="$1"
  local dockerfile="${SERVICES[$svc_name]}"
  local image_uri="${ECR_BASE}/${svc_name}"
  local tag="${ENVIRONMENT}"

  if [[ ! -f "${dockerfile}" ]]; then
    warn "Dockerfile not found: ${dockerfile} — skipping ${svc_name}"
    return
  fi

  log "Building ${svc_name} from ${dockerfile}..."

  # All services use repo root as build context
  # (Dockerfile.frontend copies src/front/myb.front/ internally)
  local context="."

  docker build \
    -t "${image_uri}:${tag}" \
    -t "${image_uri}:latest" \
    -f "${dockerfile}" \
    "${context}"

  log "Pushing ${svc_name}..."
  docker push "${image_uri}:${tag}"
  docker push "${image_uri}:latest"

  log "✓ ${svc_name} pushed to ${image_uri}:${tag}"
}

# Navigate to project root
cd "$(dirname "$0")/../.."

if [[ "${SERVICE_NAME}" == "all" ]]; then
  log "Building ALL services..."
  for svc in "${!SERVICES[@]}"; do
    build_and_push "${svc}"
  done
else
  if [[ -z "${SERVICES[$SERVICE_NAME]+x}" ]]; then
    error "Unknown service: ${SERVICE_NAME}. Available: ${!SERVICES[*]}"
  fi
  build_and_push "${SERVICE_NAME}"
fi

log "✅ Done! All images pushed to ECR."
