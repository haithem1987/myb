#!/bin/bash
# Deploy MYB Platform to OVHCloud Kubernetes
# This script deploys all services to your OVHCloud Kubernetes cluster

set -e  # Exit on error
set -o pipefail

# Configuration
NAMESPACE="${NAMESPACE:-myb-platform}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
K8S_DIR="$PROJECT_ROOT/ovhcloud/k8s"
REGISTRY="${DOCKER_REGISTRY:-93pf2bi9.gra7.container-registry.ovh.net/myb}"
GIT_BRANCH="$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD | tr '/[:upper:]' '-[:lower:]')"
GIT_SHA="$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)"
IMAGE_TAG="${IMAGE_TAG:-${GIT_BRANCH}-${GIT_SHA}}"
ASSUME_YES=false
CONFIRM_SECRETS=false
DRY_RUN=false

# OVHCloud kubeconfig
export KUBECONFIG="${KUBECONFIG:-$PROJECT_ROOT/terraform/ovh/environments/hprd/kubeconfig-hprd.yml}"

usage() {
    echo "Usage: $0 [--yes] [--confirm-secrets] [--dry-run] [--image-tag TAG]"
    echo "  --yes              Skip deployment confirmation prompt"
    echo "  --confirm-secrets  Skip the secret confirmation prompt (live values are still validated)"
    echo "  --dry-run          Render/apply client-side validation only"
    echo "  --image-tag TAG    Deploy this registry tag (default: current branch-short SHA)"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --yes|-y)
            ASSUME_YES=true
            shift
            ;;
        --confirm-secrets)
            CONFIRM_SECRETS=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --image-tag)
            if [[ $# -lt 2 || -z "$2" ]]; then
                echo "Error: --image-tag requires a value"
                usage
            fi
            IMAGE_TAG="$2"
            shift 2
            ;;
        --help|-h)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

KUBECTL_APPLY_ARGS=()
if [[ "$DRY_RUN" == "true" ]]; then
    KUBECTL_APPLY_ARGS+=(--dry-run=client)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MYB Platform - OVHCloud Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
echo -e "${YELLOW}Image tag: ${IMAGE_TAG}${NC}"

# Check if kubectl is configured
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo -e "${RED}Error: kubectl is not configured or cluster is not accessible${NC}"
    echo -e "${YELLOW}Please configure kubectl to connect to your OVHCloud cluster${NC}"
    echo -e "Run: ovhai kubeconfig download <cluster-id>"
    exit 1
fi

# Display cluster info
echo -e "\n${BLUE}Current cluster:${NC}"
kubectl cluster-info | head -n 1

if [[ "$ASSUME_YES" != "true" ]]; then
    echo -e "\n${YELLOW}This will deploy to cluster above. Continue? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
fi

# Function to wait for resource
wait_for_resource() {
    local resource=$1
    local timeout=${2:-300}
    
    echo -e "${YELLOW}Waiting for ${resource} to be ready...${NC}"
    if kubectl wait --for=condition=available --timeout="${timeout}s" "$resource" -n "$NAMESPACE" 2>/dev/null; then
        echo -e "${GREEN}✓ ${resource} is ready${NC}"
        return 0
    else
        echo -e "${RED}✗ ${resource} did not become ready within ${timeout}s${NC}"
        kubectl get pods -n "$NAMESPACE"
        return 1
    fi
}

# Apply every resource in a multi-document service manifest while replacing
# exactly one container image. This prevents the checked-in :latest placeholder
# from briefly replacing the intended image during kubectl apply.
apply_service_deployment() {
    local service=$1
    local container=$2
    local manifest=$3
    local image="${REGISTRY}/myb-${service}:${IMAGE_TAG}"

    awk -v target_container="$container" -v target_image="$image" '
        $1 == "-" && $2 == "name:" && $3 == target_container {
            in_target_container = 1
        }
        in_target_container && $1 == "image:" {
            match($0, /^[[:space:]]*/)
            print substr($0, RSTART, RLENGTH) "image: " target_image
            in_target_container = 0
            replacements++
            next
        }
        { print }
        END {
            if (replacements != 1) {
                print "Error: expected exactly one image for container " target_container > "/dev/stderr"
                exit 1
            }
        }
    ' "$manifest" | kubectl apply -f - "${KUBECTL_APPLY_ARGS[@]}"
}

# Git contains placeholder-only secret templates. Validate the live values
# without printing them; never apply the templates over an existing cluster.
validate_live_secret_key() {
    local secret_name=$1
    local key_name=$2
    local encoded_value
    local decoded_value

    if ! encoded_value=$(kubectl get secret "$secret_name" -n "$NAMESPACE" \
        -o "go-template={{index .data \"${key_name}\"}}" 2>/dev/null) || [[ -z "$encoded_value" ]]; then
        echo -e "${RED}Error: missing ${secret_name}/${key_name} in namespace ${NAMESPACE}${NC}"
        return 1
    fi

    if ! decoded_value=$(printf '%s' "$encoded_value" | base64 --decode 2>/dev/null); then
        echo -e "${RED}Error: ${secret_name}/${key_name} is not valid base64 data${NC}"
        return 1
    fi

    if [[ -z "$decoded_value" || "$decoded_value" == REPLACE_WITH* ]]; then
        echo -e "${RED}Error: ${secret_name}/${key_name} is empty or still contains a placeholder${NC}"
        return 1
    fi
}

# Step 1: Create namespace
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 1: Creating Namespace${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/namespaces/myb-namespace.yaml" "${KUBECTL_APPLY_ARGS[@]}"
echo -e "${GREEN}✓ Namespace created${NC}"

# Step 2: Validate live secrets
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 2: Validating Live Secrets${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "${YELLOW}Secrets are provisioned separately and will not be applied from Git templates.${NC}"
if [[ "$CONFIRM_SECRETS" != "true" ]]; then
    echo -e "\n${YELLOW}Validate the existing live secrets before deploying? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 1
    fi
fi

REQUIRED_LIVE_SECRET_KEYS=(
    "database-credentials:KEYCLOAK_DB_URL"
    "database-credentials:KEYCLOAK_DB_USER"
    "database-credentials:KEYCLOAK_DB_PASSWORD"
    "database-credentials:COPROPERTY_DB_CONNECTION_STRING"
    "database-credentials:INVOICE_DB_CONNECTION_STRING"
    "database-credentials:NOTIFICATION_DB_CONNECTION_STRING"
    "keycloak-credentials:KEYCLOAK_ADMIN_USER"
    "keycloak-credentials:KEYCLOAK_ADMIN_PASSWORD"
    "harbor-registry-credentials:.dockerconfigjson"
)

for secret_spec in "${REQUIRED_LIVE_SECRET_KEYS[@]}"; do
    IFS=':' read -r secret_name key_name <<< "$secret_spec"
    validate_live_secret_key "$secret_name" "$key_name"
done
echo -e "${GREEN}✓ Required live secrets validated${NC}"

# Step 3: Apply ConfigMaps
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 3: Applying ConfigMaps${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -k "$K8S_DIR/config" "${KUBECTL_APPLY_ARGS[@]}"
echo -e "${GREEN}✓ ConfigMaps applied${NC}"

# Step 4: Deploy RabbitMQ
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 4: Deploying RabbitMQ${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/services/rabbitmq/deployment.yaml" "${KUBECTL_APPLY_ARGS[@]}"
[[ "$DRY_RUN" != "true" ]] && wait_for_resource "deployment/rabbitmq" 180

# Step 5: Deploy Keycloak
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 5: Deploying Keycloak${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/services/keycloak/deployment.yaml" "${KUBECTL_APPLY_ARGS[@]}"
[[ "$DRY_RUN" != "true" ]] && wait_for_resource "deployment/keycloak" 300

# Step 6: Deploy Backend Services
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 6: Deploying Backend Services${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "${YELLOW}Deploying Coproperty Service...${NC}"
apply_service_deployment "coproperty" "coproperty" \
    "$K8S_DIR/services/coproperty/deployment.yaml"

echo -e "${YELLOW}Deploying Invoice Service...${NC}"
apply_service_deployment "invoice" "invoice" \
    "$K8S_DIR/services/invoice/deployment.yaml"

echo -e "${YELLOW}Deploying Mailer Service...${NC}"
apply_service_deployment "mailer" "mailer" \
    "$K8S_DIR/services/mailer/deployment.yaml"

echo -e "${YELLOW}Deploying Notification Service...${NC}"
apply_service_deployment "notification" "notification" \
    "$K8S_DIR/services/notification/deployment.yaml"

if [[ "$DRY_RUN" != "true" ]]; then
    wait_for_resource "deployment/myb-coproperty" 180
    wait_for_resource "deployment/myb-invoice" 180
    wait_for_resource "deployment/myb-mailer" 180
    wait_for_resource "deployment/myb-notification" 180
fi

# Step 7: Deploy Frontend
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 7: Deploying Frontend${NC}"
echo -e "${GREEN}========================================${NC}"

apply_service_deployment "admin" "admin-frontend" \
    "$K8S_DIR/services/admin/deployment.yaml"
[[ "$DRY_RUN" != "true" ]] && wait_for_resource "deployment/myb-admin" 120

echo -e "${YELLOW}Deploying Client Frontend (Owner Portal)...${NC}"
apply_service_deployment "client" "client-frontend" \
    "$K8S_DIR/services/client/deployment.yaml"
[[ "$DRY_RUN" != "true" ]] && wait_for_resource "deployment/myb-client" 120

# Step 8: Deploy Ingress
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Step 8: Deploying Ingress${NC}"
echo -e "${GREEN}========================================${NC}"

kubectl apply -f "$K8S_DIR/ingress/ingress.yaml" "${KUBECTL_APPLY_ARGS[@]}"
echo -e "${GREEN}✓ Ingress deployed${NC}"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "\n${GREEN}Dry run complete. No resources were changed.${NC}"
    exit 0
fi

# Display deployment status
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Status${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Pods:${NC}"
kubectl get pods -n "$NAMESPACE"

echo -e "\n${BLUE}Services:${NC}"
kubectl get services -n "$NAMESPACE"

echo -e "\n${BLUE}Ingress:${NC}"
kubectl get ingress -n "$NAMESPACE"

# Get external IP
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Access Information${NC}"
echo -e "${GREEN}========================================${NC}"

INGRESS_IP=$(kubectl get ingress myb-ingress -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

if [ "$INGRESS_IP" = "pending" ] || [ -z "$INGRESS_IP" ]; then
    echo -e "${YELLOW}⚠ External IP is still being assigned...${NC}"
    echo -e "${YELLOW}Run this command to check: kubectl get ingress -n $NAMESPACE${NC}"
else
    echo -e "${GREEN}External IP: ${INGRESS_IP}${NC}"
    echo -e "\n${BLUE}Access URLs:${NC}"
    echo -e "  Admin: http://${INGRESS_IP}/admin"
    echo -e "  Keycloak: http://${INGRESS_IP}/auth"
    echo -e "  Coproperty API: http://${INGRESS_IP}/api/coproperty"
    echo -e "  Invoice API: http://${INGRESS_IP}/api/invoice"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Useful commands:${NC}"
echo -e "  View logs: kubectl logs -f deployment/<service-name> -n $NAMESPACE"
echo -e "  Check status: kubectl get all -n $NAMESPACE"
echo -e "  Describe pod: kubectl describe pod <pod-name> -n $NAMESPACE"
echo -e "  Port forward: kubectl port-forward svc/<service-name> 8080:8080 -n $NAMESPACE"
echo -e "  Update deployment: kubectl rollout restart deployment/<service-name> -n $NAMESPACE"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Configure your domain DNS to point to: ${INGRESS_IP}"
echo -e "2. Update Ingress with your domain name"
echo -e "3. Set up SSL/TLS certificates with cert-manager"
echo -e "4. Configure Keycloak realm and clients"
echo -e "5. Run database migrations"
