#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# MYB Coproperty - Google Cloud Deployment Script
# Deploys: myb-coproperty, keycloak, copropertyDB, keycloak-db,
#          rabbitmq, myb-front on a single Compute Engine VM
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load env file
ENV_FILE="${PROJECT_ROOT}/.env.gcp"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found."
  echo "  cp .env.gcp.example .env.gcp  # then fill in your values"
  exit 1
fi
source "$ENV_FILE"

# Validate required vars
for var in GCP_PROJECT_ID GCP_REGION GCP_ZONE; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: $var is not set in $ENV_FILE"
    exit 1
  fi
done

VM_NAME="${VM_NAME:-myb-coproperty-vm}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-medium}"
DISK_SIZE="${DISK_SIZE:-30}"
ARTIFACT_REPO="myb-repo"

# ─── Colors ───────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ─── Functions ────────────────────────────────────────────────────

setup_gcp_project() {
  info "Setting GCP project to ${GCP_PROJECT_ID}..."
  gcloud config set project "$GCP_PROJECT_ID"
  gcloud config set compute/region "$GCP_REGION"
  gcloud config set compute/zone "$GCP_ZONE"
}

enable_apis() {
  info "Enabling required GCP APIs..."
  gcloud services enable \
    compute.googleapis.com \
    artifactregistry.googleapis.com \
    --quiet
}

create_artifact_registry() {
  info "Creating Artifact Registry repository..."
  if ! gcloud artifacts repositories describe "$ARTIFACT_REPO" \
    --location="$GCP_REGION" &>/dev/null; then
    gcloud artifacts repositories create "$ARTIFACT_REPO" \
      --repository-format=docker \
      --location="$GCP_REGION" \
      --description="MYB Docker images"
    info "Artifact Registry '${ARTIFACT_REPO}' created."
  else
    info "Artifact Registry '${ARTIFACT_REPO}' already exists."
  fi
}

configure_docker_auth() {
  info "Configuring Docker authentication for Artifact Registry..."
  gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet
}

build_and_push_images() {
  local REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REPO}"
  local TAG="${IMAGE_TAG:-latest}"

  cd "$PROJECT_ROOT"

  # Build Docker images
  info "Building myb-coproperty backend image..."
  docker build \
    -t "${REGISTRY}/myb-coproperty:${TAG}" \
    -f src/services/coproperty-management/Myb.Coproperty/Dockerfile \
    .

  info "Building myb-admin frontend image (includes Angular build)..."
  docker build \
    -t "${REGISTRY}/myb-admin:${TAG}" \
    -f Dockerfile.frontend \
    --build-arg APP_NAME=admin \
    .

  # Push images
  info "Pushing images to Artifact Registry..."
  docker push "${REGISTRY}/myb-coproperty:${TAG}"
  docker push "${REGISTRY}/myb-admin:${TAG}"

  info "Images pushed successfully."
}

create_firewall_rules() {
  info "Creating firewall rules..."
  
  # HTTP/HTTPS + Admin frontend
  if ! gcloud compute firewall-rules describe allow-myb-http &>/dev/null 2>&1; then
    gcloud compute firewall-rules create allow-myb-http \
      --allow=tcp:80,tcp:443,tcp:4201 \
      --target-tags=myb-server \
      --description="Allow HTTP/HTTPS and Admin frontend for MYB" \
      --quiet
  fi

  # Keycloak
  if ! gcloud compute firewall-rules describe allow-myb-keycloak &>/dev/null 2>&1; then
    gcloud compute firewall-rules create allow-myb-keycloak \
      --allow=tcp:8080 \
      --target-tags=myb-server \
      --description="Allow Keycloak access" \
      --quiet
  fi

  # Coproperty API
  if ! gcloud compute firewall-rules describe allow-myb-api &>/dev/null 2>&1; then
    gcloud compute firewall-rules create allow-myb-api \
      --allow=tcp:8088 \
      --target-tags=myb-server \
      --description="Allow Coproperty API access" \
      --quiet
  fi
}

create_vm() {
  info "Creating Compute Engine VM: ${VM_NAME}..."

  if gcloud compute instances describe "$VM_NAME" --zone="$GCP_ZONE" &>/dev/null 2>&1; then
    warn "VM '${VM_NAME}' already exists. Skipping creation."
    return
  fi

  gcloud compute instances create "$VM_NAME" \
    --zone="$GCP_ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --boot-disk-size="${DISK_SIZE}GB" \
    --boot-disk-type=pd-balanced \
    --image-family=cos-stable \
    --image-project=cos-cloud \
    --tags=myb-server \
    --scopes=cloud-platform \
    --metadata=startup-script='#!/bin/bash
      # Container-Optimized OS comes with Docker pre-installed
      # Install docker-compose
      COMPOSE_VERSION="v2.27.0"
      sudo mkdir -p /usr/local/lib/docker/cli-plugins
      sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
      sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
      
      # Authenticate Docker with Artifact Registry
      docker-credential-gcr configure-docker --registries='"${GCP_REGION}"'-docker.pkg.dev
    '

  info "VM created. Waiting for it to be ready..."
  sleep 30
}

deploy_to_vm() {
  info "Deploying to VM..."

  local REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REPO}"
  local TAG="${IMAGE_TAG:-latest}"

  # Create a deployment directory on the VM
  gcloud compute ssh "$VM_NAME" --zone="$GCP_ZONE" --command="mkdir -p ~/myb-deploy"

  # Copy docker-compose and env file
  gcloud compute scp \
    "${PROJECT_ROOT}/docker-compose.gcp.yml" \
    "${PROJECT_ROOT}/.env.gcp" \
    "${VM_NAME}:~/myb-deploy/" \
    --zone="$GCP_ZONE"

  # Get VM external IP for Keycloak URL
  local VM_IP
  VM_IP=$(gcloud compute instances describe "$VM_NAME" \
    --zone="$GCP_ZONE" \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

  # Deploy with docker compose on the VM
  gcloud compute ssh "$VM_NAME" --zone="$GCP_ZONE" --command="
    cd ~/myb-deploy

    # Update Keycloak external URL with actual VM IP
    sed -i 's|KEYCLOAK_EXTERNAL_URL=.*|KEYCLOAK_EXTERNAL_URL=http://${VM_IP}:8080|' .env.gcp

    # Authenticate Docker with Artifact Registry
    docker-credential-gcr configure-docker --registries=${GCP_REGION}-docker.pkg.dev 2>/dev/null || true

    # Pull latest images
    docker compose -f docker-compose.gcp.yml --env-file .env.gcp pull myb-coproperty myb-admin 2>/dev/null || true

    # Start all services
    docker compose -f docker-compose.gcp.yml --env-file .env.gcp up -d

    echo '────────────────────────────────────────'
    echo 'Services starting...'
    docker compose -f docker-compose.gcp.yml ps
  "

  echo ""
  info "═══════════════════════════════════════════════════"
  info "  Deployment complete!"
  info "═══════════════════════════════════════════════════"
  info ""
  info "  Admin:        http://${VM_IP}:4201"
  info "  Coproperty:   http://${VM_IP}:8088/graphql"
  info "  Keycloak:     http://${VM_IP}:8080"
  info "  RabbitMQ UI:  http://${VM_IP}:15672"
  info ""
  info "  SSH into VM:  gcloud compute ssh ${VM_NAME} --zone=${GCP_ZONE}"
  info "  View logs:    gcloud compute ssh ${VM_NAME} --zone=${GCP_ZONE} --command='cd ~/myb-deploy && docker compose -f docker-compose.gcp.yml logs -f'"
  info "═══════════════════════════════════════════════════"
}

destroy() {
  warn "This will delete the VM and all its data!"
  read -rp "Are you sure? (y/N): " confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    gcloud compute instances delete "$VM_NAME" --zone="$GCP_ZONE" --quiet
    info "VM deleted."
  fi
}

show_help() {
  cat <<EOF
MYB Coproperty - GCP Deployment Script

Usage: $0 <command>

Commands:
  setup       Configure GCP project, enable APIs, create Artifact Registry
  build       Build & push Docker images to Artifact Registry
  create-vm   Create the Compute Engine VM
  deploy      Deploy services to the VM
  full        Run setup + build + create-vm + deploy (full deployment)
  status      Show deployment status
  logs        Stream logs from all services
  destroy     Delete the VM (DESTRUCTIVE)
  help        Show this help message

Examples:
  $0 full              # First-time full deployment
  $0 build && $0 deploy  # Rebuild and redeploy after code changes

Prerequisites:
  - Google Cloud SDK (gcloud) installed and authenticated
  - Docker installed locally
  - .env.gcp file configured (copy from .env.gcp.example)
EOF
}

show_status() {
  gcloud compute ssh "$VM_NAME" --zone="$GCP_ZONE" --command="
    cd ~/myb-deploy
    echo '─── Container Status ───'
    docker compose -f docker-compose.gcp.yml ps
    echo ''
    echo '─── Resource Usage ───'
    docker stats --no-stream
  "
}

show_logs() {
  gcloud compute ssh "$VM_NAME" --zone="$GCP_ZONE" --command="
    cd ~/myb-deploy
    docker compose -f docker-compose.gcp.yml logs -f --tail=100
  "
}

# ─── Main ─────────────────────────────────────────────────────────
case "${1:-help}" in
  setup)
    setup_gcp_project
    enable_apis
    create_artifact_registry
    configure_docker_auth
    ;;
  build)
    build_and_push_images
    ;;
  create-vm)
    create_firewall_rules
    create_vm
    ;;
  deploy)
    deploy_to_vm
    ;;
  full)
    setup_gcp_project
    enable_apis
    create_artifact_registry
    configure_docker_auth
    build_and_push_images
    create_firewall_rules
    create_vm
    deploy_to_vm
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs
    ;;
  destroy)
    destroy
    ;;
  help|*)
    show_help
    ;;
esac
