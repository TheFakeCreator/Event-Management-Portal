#!/bin/bash

# =============================================================================
# Production Deployment Script
# Event Management Portal - Complete Deployment Automation
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
LOG_FILE="deployment.log"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] STEP: $1" >> "$LOG_FILE"
}

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "               EVENT MANAGEMENT PORTAL"
    echo "                Production Deployment"
    echo "============================================================================="
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking deployment prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Production environment file ($ENV_FILE) not found"
        log_info "Please create $ENV_FILE based on the template"
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file ($COMPOSE_FILE) not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Function to validate environment variables
validate_environment() {
    print_status "Validating environment configuration..."
    
    # Source environment file
    source "$ENV_FILE"
    
    # Check critical environment variables
    required_vars=(
        "NEXT_PUBLIC_APP_URL"
        "NEXT_PUBLIC_API_URL"
        "NEXTAUTH_SECRET"
        "MONGODB_URI"
        "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_warning "Please configure these variables in $ENV_FILE"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    
    # Create backup directory
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup MongoDB if container is running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q mongodb; then
        print_status "Backing up MongoDB..."
        docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongodump \
            --out /tmp/backup \
            --db event_management
        
        docker-compose -f "$COMPOSE_FILE" exec -T mongodb tar -czf \
            /tmp/mongodb_backup.tar.gz -C /tmp backup
        
        docker cp "$(docker-compose -f "$COMPOSE_FILE" ps -q mongodb)":/tmp/mongodb_backup.tar.gz \
            "$BACKUP_DIR/mongodb_backup.tar.gz"
        
        print_success "Database backup created at $BACKUP_DIR"
    else
        print_warning "MongoDB container not running, skipping backup"
    fi
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    
    # Build images with no cache for fresh deployment
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    print_success "Images built successfully"
}

# Function to deploy services
deploy_services() {
    print_status "Deploying services..."
    
    # Pull latest images for external services
    docker-compose -f "$COMPOSE_FILE" pull mongodb redis nginx
    
    # Stop existing services
    print_status "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start services in correct order
    print_status "Starting database services..."
    docker-compose -f "$COMPOSE_FILE" up -d mongodb redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    print_status "Starting backend services..."
    docker-compose -f "$COMPOSE_FILE" up -d backend
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    sleep 10
    
    print_status "Starting frontend and proxy services..."
    docker-compose -f "$COMPOSE_FILE" up -d frontend nginx
    
    print_success "All services deployed"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Wait for services to be fully ready
    sleep 20
    
    # Check service health
    services=("mongodb" "redis" "backend" "frontend" "nginx")
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            print_success "$service is running"
        else
            print_error "$service failed to start"
            docker-compose -f "$COMPOSE_FILE" logs "$service"
            exit 1
        fi
    done
    
    # Test HTTP endpoints
    print_status "Testing HTTP endpoints..."
    
    # Test frontend
    if curl -f -s "http://localhost" > /dev/null; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding"
        exit 1
    fi
    
    # Test backend API
    if curl -f -s "http://localhost/api/health" > /dev/null; then
        print_success "Backend API is responding"
    else
        print_warning "Backend API health check failed (this might be normal if health endpoint doesn't exist)"
    fi
    
    print_success "Deployment verification completed"
}

# Function to show deployment info
show_deployment_info() {
    echo
    echo "=============================================="
    echo -e "${GREEN}🎉 Deployment Completed Successfully!${NC}"
    echo "=============================================="
    echo
    echo "📋 Service Information:"
    echo "  • Frontend: http://localhost"
    echo "  • Backend API: http://localhost/api"
    echo "  • MongoDB: localhost:27017"
    echo "  • Redis: localhost:6379"
    echo
    echo "🔧 Management Commands:"
    echo "  • View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  • Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "  • Restart: docker-compose -f $COMPOSE_FILE restart"
    echo
    echo "📊 Monitor deployment:"
    echo "  • Status: docker-compose -f $COMPOSE_FILE ps"
    echo "  • Resource usage: docker stats"
    echo
}

# Function to cleanup on failure
cleanup_on_failure() {
    print_error "Deployment failed! Cleaning up..."
    docker-compose -f "$COMPOSE_FILE" down
    print_status "Cleanup completed"
}

# Trap to run cleanup on failure
trap cleanup_on_failure ERR

# Main deployment process
main() {
    echo "Starting deployment at $(date)"
    
    # Run deployment steps
    check_requirements
    validate_environment
    
    # Backup only if services are running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        backup_database
    fi
    
    build_images
    deploy_services
    verify_deployment
    show_deployment_info
    
    print_success "Deployment completed successfully at $(date)"
}

# Run main function
main "$@"