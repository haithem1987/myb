#!/bin/bash

################################################################################
# MYB Project - Complete Build & Deployment Master Script
#
# Single unified script for all operations:
# - Build frontend (Angular Nx)
# - Build Docker images
# - Deploy services
# - Cleanup resources
# - Monitor health
#
# Usage:
#   ./myb.sh                           # Full deployment (everything)
#   ./myb.sh --quick                   # Fast startup (no rebuild)
#   ./myb.sh --clean                   # Clean + deploy
#   ./myb.sh --rebuild                 # Force full rebuild
#   ./myb.sh --cleanup                 # Cleanup only
#   ./myb.sh --cleanup-all             # Full cleanup
#   ./myb.sh --cleanup-myb             # Remove only MYB resources
#   ./myb.sh --frontend-only           # Build frontend only
#   ./myb.sh --help                    # Show this help
#
################################################################################

set -e

# ============================================================================
# COLOR DEFINITIONS
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# CONFIGURATION
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
FRONTEND_DIR="$PROJECT_DIR/src/front/myb.front"
LOG_FILE="$PROJECT_DIR/deployment.log"

# Operation flags
OPERATION="deploy"  # deploy, quick, clean, cleanup, cleanup-all, cleanup-myb, frontend, help
BUILD_FRONTEND=true
FORCE_REBUILD=false
CLEAN_FIRST=false

# ============================================================================
# OUTPUT FUNCTIONS
# ============================================================================
print_header() {
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}"
}

print_section() {
  echo ""
  echo -e "${CYAN}─── $1 ───${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

print_cmd() {
  echo -e "${MAGENTA}→ $1${NC}"
}

# ============================================================================
# HELP FUNCTION
# ============================================================================
show_help() {
  cat << 'EOF'

MYB Master Deployment Script - Usage Guide

MAIN OPERATIONS:
  ./myb.sh                    Full deployment (build + deploy everything)
  ./myb.sh --quick            Quick start (fast restart, no rebuild)
  ./myb.sh --clean            Clean images then deploy
  ./myb.sh --rebuild          Force rebuild all images from scratch

SPECIALIZED OPERATIONS:
  ./myb.sh --frontend-only    Build frontend only (no Docker)
  ./myb.sh --cleanup          Safe cleanup (dangling resources)
  ./myb.sh --cleanup-all      Full cleanup (all unused resources)
  ./myb.sh --cleanup-myb      Remove only MYB resources

INFORMATION:
  ./myb.sh --help             Show this help message
  ./myb.sh --status           Show current service status
  ./myb.sh --logs             Tail service logs
  ./myb.sh --logs SERVICE     Tail specific service logs

COMMON WORKFLOWS:

1. First Time Setup:
   ./myb.sh
   
2. Daily Restart:
   ./myb.sh --quick
   
3. After Code Changes:
   ./myb.sh --frontend-only           # If frontend changed
   docker-compose build SERVICE_NAME  # If backend changed
   ./myb.sh --quick
   
4. Disk Space Issues:
   ./myb.sh --cleanup-all
   ./myb.sh --rebuild

5. Reset Everything:
   ./myb.sh --cleanup-myb
   ./myb.sh

EXAMPLES:

  # Production deployment with cleanup
  ./myb.sh --clean --rebuild
  
  # Development quick restart
  ./myb.sh --quick
  
  # Check what's running
  ./myb.sh --status
  ./myb.sh --logs

EOF
}

# ============================================================================
# STATUS FUNCTIONS
# ============================================================================
show_status() {
  print_header "Service Status"
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" ps
}

show_logs() {
  local service="$1"
  if [ -z "$service" ]; then
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" logs -f
  else
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" logs -f "$service"
  fi
}

# ============================================================================
# DOCKER HEALTH CHECK
# ============================================================================
check_docker() {
  print_section "Checking Docker Installation"
  
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
  fi
  
  if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    print_info "Please start Docker Desktop or Docker daemon"
    exit 1
  fi
  
  print_success "Docker is installed and running"
  docker --version
}

# ============================================================================
# DUPLICATE IMAGE DETECTION & CLEANUP
# ============================================================================
find_duplicate_images() {
  print_section "Checking for Duplicate Images"
  
  local duplicates=$(docker images --format "table {{.Repository}}:{{.Tag}}" | tail -n +2 | sort | uniq -d)
  
  if [ -z "$duplicates" ]; then
    print_success "No duplicate images found"
    return 0
  fi
  
  print_warning "Found duplicate images:"
  echo "$duplicates" | while read image; do
    print_warning "  - $image"
  done
  
  return 1
}

list_myb_images() {
  print_section "Current MYB Images"
  
  local myb_images=$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep "myb_" 2>/dev/null)
  
  if [ -z "$myb_images" ]; then
    print_info "No MYB images found"
    return
  fi
  
  echo "$myb_images"
}

clean_duplicate_images() {
  print_section "Cleaning Duplicate Images"
  
  # First stop all MYB containers
  print_info "Stopping running containers..."
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" down 2>/dev/null || true
  sleep 2
  
  # Force remove any remaining MYB containers
  docker ps -a --format "{{.Names}}" | grep -E "myb|keycloak" | while read container; do
    if [ ! -z "$container" ]; then
      print_info "Removing container: $container"
      docker rm -f "$container" 2>/dev/null || true
    fi
  done
  
  # Now remove duplicate images (keep only newest)
  local cleaned=0
  docker images --format "{{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.ID}}" | \
    grep -v "^<none>" | sort -k2 -r | awk '{print $1}' | tail -n +2 | while read tag; do
    if [ ! -z "$tag" ] && [ "$tag" != "<none>:<none>" ]; then
      print_info "Removing duplicate: $tag"
      docker rmi -f "$tag" 2>/dev/null || true
      ((cleaned++))
    fi
  done
  
  # Clean dangling images
  print_info "Cleaning dangling images..."
  docker image prune -f --filter "dangling=true" 2>/dev/null || true
  
  print_success "Duplicate image cleanup complete"
}

# ============================================================================
# REQUIRED FILES CHECK
# ============================================================================
check_required_files() {
  print_section "Checking Required Files"
  
  local required_files=(
    "docker-compose.yml"
    "src/front/myb.front/Dockerfile"
    "src/front/myb.front/nginx.conf"
  )
  
  for file in "${required_files[@]}"; do
    if [ ! -f "$PROJECT_DIR/$file" ]; then
      print_error "Missing required file: $file"
      exit 1
    fi
    print_success "Found: $file"
  done
}

# ============================================================================
# ENVIRONMENT SETUP
# ============================================================================
check_env_file() {
  print_section "Checking Environment Configuration"
  
  if [ ! -f "$PROJECT_DIR/.env" ]; then
    if [ -f "$PROJECT_DIR/.env.example" ]; then
      print_warning "No .env file found, creating from .env.example"
      cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
      print_success "Created .env file (using defaults)"
      print_warning "IMPORTANT: Review and update .env file for production use"
    else
      print_error ".env and .env.example not found"
      exit 1
    fi
  else
    print_success "Found .env file"
  fi
}

# ============================================================================
# CONTAINER MANAGEMENT
# ============================================================================
remove_myb_containers() {
  print_section "Stopping & Removing MYB Containers"
  
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" down --remove-orphans 2>/dev/null || true
  
  print_success "Containers stopped and removed"
}

# ============================================================================
# FRONTEND BUILD
# ============================================================================
build_frontend() {
  if [ "$BUILD_FRONTEND" = false ]; then
    print_section "Skipping Frontend Build"
    print_info "Using existing dist/apps/client"
    return 0
  fi
  
  print_section "Building Frontend (Angular Nx Workspace)"
  
  if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
  fi
  
  cd "$FRONTEND_DIR"
  
  # Only install if node_modules is missing or package.json changed
  if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install --legacy-peer-deps --no-audit --silent 2>&1 | tee -a "$LOG_FILE"
  else
    print_info "Dependencies up to date, skipping npm install"
  fi
  
  print_info "Building client app (with cache)..."
  npx nx build client --configuration=production 2>&1 | tee -a "$LOG_FILE"
  
  if [ ! -d "$FRONTEND_DIR/dist/apps/client" ]; then
    print_error "Frontend build failed - $FRONTEND_DIR/dist/apps/client not created"
    exit 1
  fi
  
  cd "$PROJECT_DIR"
  print_success "Frontend build completed successfully"
}

# ============================================================================
# DOCKER BUILD
# ============================================================================
build_docker_images() {
  print_section "Building Docker Images"
  
  if [ "$FORCE_REBUILD" = true ]; then
    print_info "Force rebuild enabled - using --no-cache"
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" build --no-cache 2>&1 | tee -a "$LOG_FILE"
  else
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" build 2>&1 | tee -a "$LOG_FILE"
  fi
  
  print_success "Docker images built successfully"
}

# ============================================================================
# SERVICE STARTUP
# ============================================================================
start_services() {
  print_section "Starting Services"
  
  # Step 1: Start databases
  print_info "Step 1/6: Starting databases..."
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d keycloak-db timesheetDB documentDB invoiceDB 2>&1 | tee -a "$LOG_FILE"
  if [ $? -ne 0 ]; then
    print_error "Failed to start databases"
    exit 1
  fi
  print_success "Databases starting..."
  sleep 8
  
  # Step 2: Start Keycloak
  print_info "Step 2/6: Starting Keycloak..."
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d keycloak 2>&1 | tee -a "$LOG_FILE"
  if [ $? -ne 0 ]; then
    print_error "Failed to start Keycloak"
    exit 1
  fi
  print_success "Keycloak starting..."
  
  # Wait for Keycloak to be healthy
  print_info "Waiting for Keycloak to be healthy (max 60s)..."
  local keycloak_wait=0
  while [ $keycloak_wait -lt 60 ]; do
    if docker ps --filter "name=keycloak" --filter "health=healthy" 2>/dev/null | grep -q keycloak; then
      print_success "Keycloak is healthy!"
      break
    fi
    sleep 3
    keycloak_wait=$((keycloak_wait + 3))
    echo -n "."
  done
  echo ""
  
  # Step 3: Start payment service
  print_info "Step 3/6: Starting payment service..."
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d myb-payment 2>&1 | tee -a "$LOG_FILE"
  if [ $? -ne 0 ]; then
    print_error "Failed to start payment service"
    exit 1
  fi
  print_success "Payment service started"
  sleep 3
  
  # Step 4: Start invoice service
  print_info "Step 4/6: Starting invoice service..."
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d myb-invoice 2>&1 | tee -a "$LOG_FILE"
  if [ $? -ne 0 ]; then
    print_error "Failed to start invoice service"
    exit 1
  fi
  print_success "Invoice service started"
  sleep 3
  
  # Step 5: Start remaining backend services
  print_info "Step 5/6: Starting remaining backend services (timesheet, document, usermanager, notification)..."
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d myb-timesheet myb-docmanager myb-usermanager myb-notification 2>&1 | tee -a "$LOG_FILE"
  if [ $? -ne 0 ]; then
    print_error "Failed to start backend services"
    exit 1
  fi
  print_success "Backend services started"
  sleep 5
  
  # Step 6: Start frontend
  print_info "Step 6/6: Starting frontend..."
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d myb-front 2>&1 | tee -a "$LOG_FILE"
  if [ $? -ne 0 ]; then
    print_error "Failed to start frontend"
    exit 1
  fi
  print_success "Frontend started"
  
  echo ""
  print_success "All services started successfully!"
}

# ============================================================================
# HEALTH MONITORING
# ============================================================================
wait_for_services() {
  print_section "Waiting for Services to Become Healthy"
  
  local max_wait=120
  local elapsed=0
  local interval=5
  
  while [ $elapsed -lt $max_wait ]; do
    print_info "Checking service health... ($elapsed/$max_wait seconds)"
    
    if docker-compose -f "$PROJECT_DIR/docker-compose.yml" ps keycloak 2>/dev/null | grep -q "healthy"; then
      print_success "Keycloak is healthy"
      sleep 3
      return 0
    fi
    
    sleep $interval
    elapsed=$((elapsed + interval))
  done
  
  print_warning "Services did not reach healthy state within $max_wait seconds"
  print_info "Services are running but may still be initializing"
}

# ============================================================================
# STATUS DISPLAY
# ============================================================================
display_service_status() {
  print_header "Service Status"
  
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" ps
  
  echo ""
  print_section "Access URLs"
  
  echo -e "${GREEN}Frontend (Angular)${NC}"
  echo -e "  🌐 http://localhost:4200"
  echo ""
  
  echo -e "${GREEN}Keycloak (Identity)${NC}"
  echo -e "  🔐 http://localhost:8080"
  echo -e "  👤 Username: admin"
  echo -e "  🔑 Password: (check .env)"
  echo ""
  
  echo -e "${GREEN}Backend Services${NC}"
  echo -e "  👥 User Manager:     http://localhost:8087"
  echo -e "  ⏱️  Timesheet:        http://localhost:8082"
  echo -e "  📄 Invoice:          http://localhost:8083"
  echo -e "  📁 Document Manager: http://localhost:8086"
  echo -e "  💳 Payment:          http://localhost:8084"
  echo -e "  🔔 Notification:     http://localhost:8085"
  echo ""
  
  echo -e "${GREEN}Databases${NC}"
  echo -e "  🗄️  Keycloak DB:  localhost:5450"
  echo -e "  🗄️  Timesheet DB: localhost:5448"
  echo -e "  🗄️  Document DB:  localhost:5433"
  echo -e "  🗄️  Invoice DB:   localhost:5434"
}

# ============================================================================
# CLEANUP FUNCTIONS
# ============================================================================
cleanup_safe() {
  print_header "Safe Cleanup"
  
  print_section "Cleaning Dangling Images"
  local dangling=$(docker images --filter "dangling=true" --quiet)
  if [ ! -z "$dangling" ]; then
    echo "$dangling" | xargs -r docker rmi 2>/dev/null || print_warning "Some images could not be removed"
    print_success "Dangling images removed"
  else
    print_success "No dangling images found"
  fi
  
  print_section "Cleaning Stopped Containers"
  docker container prune -f --filter "until=24h" 2>/dev/null || true
  print_success "Stopped containers cleaned"
  
  print_section "Cleaning Dangling Volumes"
  docker volume prune -f 2>/dev/null || true
  print_success "Dangling volumes cleaned"
}

cleanup_all() {
  print_header "Full Docker Cleanup"
  print_warning "This will remove ALL unused Docker resources"
  
  print_info "Running: docker system prune -af --volumes"
  docker system prune -af --volumes
  
  print_success "Full Docker cleanup complete"
}

cleanup_myb_resources() {
  print_header "Cleaning MYB Resources Only"
  
  print_section "Stopping MYB Services"
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" down -v 2>/dev/null || true
  
  print_section "Removing MYB Containers"
  docker ps -a --format "table {{.Names}}\t{{.Image}}" | grep "myb_" | awk '{print $1}' | while read container; do
    if [ ! -z "$container" ]; then
      print_info "  Removing: $container"
      docker rm -f "$container" 2>/dev/null || true
    fi
  done
  
  print_section "Removing MYB Images"
  docker images --format "table {{.Repository}}:{{.Tag}}" | grep "myb_" | while read image; do
    if [ ! -z "$image" ]; then
      print_info "  Removing: $image"
      docker rmi -f "$image" 2>/dev/null || true
    fi
  done
  
  print_section "Removing MYB Volumes"
  docker volume ls --format "table {{.Name}}" | grep "myb_" | while read volume; do
    if [ ! -z "$volume" ]; then
      print_info "  Removing: $volume"
      docker volume rm "$volume" 2>/dev/null || true
    fi
  done
  
  print_success "MYB resource cleanup complete"
}

show_disk_usage() {
  print_section "Docker Disk Usage"
  
  print_info "Docker system df:"
  docker system df
  
  echo ""
  print_info "Top 10 images by size:"
  docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | sort -k2 -hr | head -11
}

# ============================================================================
# ERROR HANDLER
# ============================================================================
error_handler() {
  local line_no=$1
  print_error "Script failed at line $line_no"
  print_info "Check log file for details: $LOG_FILE"
  exit 1
}

trap 'error_handler ${LINENO}' ERR

# ============================================================================
# PARSE COMMAND LINE ARGUMENTS
# ============================================================================
parse_arguments() {
  case "$1" in
    --help)
      show_help
      exit 0
      ;;
    --status)
      show_status
      exit 0
      ;;
    --logs)
      show_logs "$2"
      exit 0
      ;;
    --quick)
      OPERATION="quick"
      BUILD_FRONTEND=false
      ;;
    --clean)
      OPERATION="deploy"
      CLEAN_FIRST=true
      ;;
    --rebuild)
      OPERATION="deploy"
      FORCE_REBUILD=true
      CLEAN_FIRST=true
      ;;
    --frontend-only)
      OPERATION="frontend"
      ;;
    --cleanup)
      OPERATION="cleanup"
      ;;
    --cleanup-all)
      OPERATION="cleanup-all"
      ;;
    --cleanup-myb)
      OPERATION="cleanup-myb"
      ;;
    *)
      if [ ! -z "$1" ]; then
        print_warning "Unknown argument: $1"
        print_info "Use --help for usage information"
        exit 1
      fi
      ;;
  esac
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================
main() {
  parse_arguments "$@"
  
  # Initialize log file
  : > "$LOG_FILE"
  echo "=== Deployment Log ===" >> "$LOG_FILE"
  echo "Started: $(date)" >> "$LOG_FILE"
  echo "Operation: $OPERATION" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  
  case "$OPERATION" in
    
    deploy)
      print_header "MYB - Full Deployment"
      
      check_docker
      
      # Check for duplicates and auto-clean them
      if ! find_duplicate_images; then
        print_warning "Duplicate images detected - removing them automatically..."
        clean_duplicate_images
        print_info "Duplicates cleaned, will rebuild fresh images"
        FORCE_REBUILD=true
      fi
      
      list_myb_images
      
      check_required_files
      check_env_file
      remove_myb_containers
      build_frontend
      build_docker_images
      start_services
      wait_for_services
      display_service_status
      
      print_header "Deployment Complete"
      print_success "All services started successfully!"
      echo ""
      echo "Log file: $LOG_FILE"
      ;;
    
    quick)
      print_header "MYB - Quick Start (No Rebuild)"
      
      check_docker
      
      # Just start services in order without rebuilding
      start_services
      sleep 3
      display_service_status
      
      print_header "Quick Start Complete"
      print_success "Services started successfully!"
      echo ""
      echo "Log file: $LOG_FILE"
      ;;
    
    frontend)
      print_header "MYB - Frontend Build Only"
      build_frontend
      print_success "Frontend build complete!"
      echo ""
      print_info "Next steps:"
      echo "  1. docker-compose build myb-front"
      echo "  2. ./myb.sh --quick"
      ;;
    
    cleanup)
      print_header "MYB - Safe Cleanup"
      cleanup_safe
      show_disk_usage
      print_success "Cleanup complete!"
      ;;
    
    cleanup-all)
      print_header "MYB - Full Docker Cleanup"
      cleanup_all
      show_disk_usage
      print_success "Full cleanup complete!"
      ;;
    
    cleanup-myb)
      print_header "MYB - Clean MYB Resources"
      cleanup_myb_resources
      show_disk_usage
      print_success "MYB cleanup complete!"
      ;;
    
    *)
      print_error "Unknown operation: $OPERATION"
      exit 1
      ;;
  esac
}

# Run main function with all arguments
main "$@"
