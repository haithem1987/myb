#!/usr/bin/env bash
# ==============================================================================
# MYB Platform - Build and Push Docker Images to LocalStack ECR
# Usage: ./build-and-push-local.sh [service_name]
# Examples:
#   ./build-and-push-local.sh              # Build and push ALL services
#   ./build-and-push-local.sh coproperty   # Build and push only coproperty
# ==============================================================================

set -euo pipefail

SERVICE_NAME="${1:-all}"
AWS_REGION="eu-west-3"
PROJECT_NAME="myb"
LOCALSTACK_ENDPOINT="http://localhost:4566"

# Ensure awslocal is on PATH
export PATH="$HOME/Library/Python/3.9/bin:$PATH"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"; }
error(){ echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Verify LocalStack is running
curl -s "${LOCALSTACK_ENDPOINT}/_localstack/health" > /dev/null 2>&1 \
  || error "LocalStack is not running. Start it first: ./scripts/localstack-start.sh"

ECR_BASE="localhost.localstack.cloud:4510/${PROJECT_NAME}"

log "ECR Base: ${ECR_BASE}"
log "LocalStack: ${LOCALSTACK_ENDPOINT}"

# Phase 1: 6 services
declare -A SERVICES=(
  ["user-manager"]="src/services/user-manager/Myb.UserManager/Dockerfile"
  ["notification"]="src/services/notification-service/Myb.Notification/Dockerfile"
  ["mailer"]="src/services/mailer-service/Myb.Mailer/Dockerfile"
  ["coproperty"]="src/services/coproperty-management/Myb.Coproperty/Dockerfile"
  ["keycloak"]="Dockerfile.keycloak"
  ["admin"]="Dockerfile.frontend"
)

build_and_push() {
  local svc_name="$1"
  local dockerfile="${SERVICES[$svc_name]}"
  local image_uri="${ECR_BASE}/${svc_name}"
  local tag="dev"

  if [[ ! -f "${dockerfile}" ]]; then
    warn "Dockerfile not found: ${dockerfile} — skipping ${svc_name}"
    return
  fi

  log "Building ${svc_name} from ${dockerfile}..."

  docker build \
    -t "${image_uri}:${tag}" \
    -t "${image_uri}:latest" \
    -f "${dockerfile}" \
    "."

  log "Pushing ${svc_name} to LocalStack ECR..."
  docker push "${image_uri}:${tag}" 2>/dev/null || true
  docker push "${image_uri}:latest" 2>/dev/null || true

  log "✓ ${svc_name} built → ${image_uri}:${tag}"
}

# Navigate to project root
cd "$(dirname "$0")/.."

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

log "✅ Done! Images built and tagged for LocalStack."
