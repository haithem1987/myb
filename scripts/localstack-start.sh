#!/usr/bin/env bash
# ==============================================================================
# MYB Platform - LocalStack Quick Start
# Starts LocalStack + applies Terraform + runs your services locally
#
# Usage:
#   ./scripts/localstack-start.sh          # Start everything
#   ./scripts/localstack-start.sh stop     # Stop LocalStack
#   ./scripts/localstack-start.sh status   # Check status
#   ./scripts/localstack-start.sh tf       # Re-apply Terraform only
# ==============================================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_ROOT}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${CYAN}[i]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Ensure Python user bin is on PATH (for tflocal/awslocal)
export PATH="$HOME/Library/Python/3.9/bin:$PATH"

check_deps() {
  for cmd in docker localstack terraform; do
    command -v "$cmd" &>/dev/null || err "$cmd is required but not found."
  done

  if ! command -v tflocal &>/dev/null; then
    warn "tflocal not found. Installing..."
    pip3 install --user terraform-local awscli-local
  fi

  if ! command -v awslocal &>/dev/null; then
    warn "awslocal not found. Installing..."
    pip3 install --user awscli-local
  fi
}

start_localstack() {
  info "Starting LocalStack..."
  docker compose -f docker-compose.localstack.yml up -d

  info "Waiting for LocalStack to be ready..."
  local retries=30
  while ! curl -s http://localhost:4566/_localstack/health | grep -q '"s3": "available"' 2>/dev/null; do
    retries=$((retries - 1))
    if [ $retries -le 0 ]; then
      err "LocalStack failed to start. Check: docker logs localstack"
    fi
    sleep 2
  done
  log "LocalStack is ready!"
}

apply_terraform() {
  info "Applying Terraform to LocalStack..."
  cd terraform/environments/localstack

  tflocal init -input=false 2>&1 | tail -5
  tflocal apply -auto-approve -input=false 2>&1 | tail -20

  log "Terraform applied successfully!"
  echo ""
  info "Resources created:"
  tflocal output 2>/dev/null || true
  cd "${PROJECT_ROOT}"
}

show_status() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  MYB LocalStack Status${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo ""

  # LocalStack health
  if curl -s http://localhost:4566/_localstack/health &>/dev/null; then
    log "LocalStack: Running"
    local services
    services=$(curl -s http://localhost:4566/_localstack/health | python3 -c "
import sys, json
data = json.load(sys.stdin)
for svc, status in data.get('services', {}).items():
    print(f'    {svc}: {status}')
" 2>/dev/null || echo "    (unable to parse)")
    echo "$services"
  else
    warn "LocalStack: Not running"
  fi

  echo ""

  # ECR repos
  info "ECR Repositories:"
  awslocal ecr describe-repositories --region eu-west-3 2>/dev/null \
    | python3 -c "
import sys, json
data = json.load(sys.stdin)
for repo in data.get('repositories', []):
    print(f'    {repo[\"repositoryName\"]}: {repo[\"repositoryUri\"]}')
" 2>/dev/null || echo "    (not yet created)"

  echo ""

  # SSM Parameters
  info "SSM Parameters:"
  awslocal ssm get-parameters-by-path --path /myb/dev --region eu-west-3 2>/dev/null \
    | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data.get('Parameters', []):
    print(f'    {p[\"Name\"]}')
" 2>/dev/null || echo "    (not yet created)"

  echo ""

  # S3 Buckets
  info "S3 Buckets:"
  awslocal s3 ls --region eu-west-3 2>/dev/null || echo "    (none)"

  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo ""
  info "Useful commands:"
  echo "    awslocal s3 ls --region eu-west-3"
  echo "    awslocal ecr describe-repositories --region eu-west-3"
  echo "    awslocal ssm get-parameter --name /myb/dev/db-password --region eu-west-3"
  echo "    tflocal plan    # (from terraform/environments/localstack/)"
  echo "    docker logs -f localstack"
  echo ""
}

stop_localstack() {
  info "Stopping LocalStack..."
  docker compose -f docker-compose.localstack.yml down
  log "LocalStack stopped."
}

# ─── Main ────────────────────────────────────────────────────────────────────

case "${1:-start}" in
  start)
    check_deps
    start_localstack
    # Wait a moment for init scripts to complete
    sleep 3
    apply_terraform
    show_status
    echo ""
    log "LocalStack is ready! Your local AWS environment is up."
    info "Next: run your app services with: docker compose -f docker-compose.dev.yml up -d"
    ;;
  stop)
    stop_localstack
    ;;
  status)
    export PATH="$HOME/Library/Python/3.9/bin:$PATH"
    show_status
    ;;
  tf)
    check_deps
    apply_terraform
    ;;
  *)
    echo "Usage: $0 {start|stop|status|tf}"
    exit 1
    ;;
esac
