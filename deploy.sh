#!/bin/bash

# Production Deployment Configuration
# Event Management Portal - Production Setup Script

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="event-management-portal"
PRODUCTION_DOMAIN="${PRODUCTION_DOMAIN:-yourdomain.com}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-your-registry.com}"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
MONGODB_URI="${MONGODB_URI:-mongodb://mongo:27017/eventmanagement}"
REDIS_URL="${REDIS_URL:-redis://redis:6379}"

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_status "All prerequisites are satisfied!"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production file not found. Creating template..."
        cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=${MONGODB_URI}

# Redis Cache
REDIS_URL=${REDIS_URL}

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary Configuration (Update with your credentials)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Update with your SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@${PRODUCTION_DOMAIN}

# Application URLs
FRONTEND_URL=https://${PRODUCTION_DOMAIN}
BACKEND_URL=https://api.${PRODUCTION_DOMAIN}

# Security
CORS_ORIGIN=https://${PRODUCTION_DOMAIN}
SESSION_SECRET=$(openssl rand -base64 32)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
PROMETHEUS_ENABLED=true
LOGGING_LEVEL=info

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_RETRIES=3
EOF
        print_warning "Please update .env.production with your actual configuration values!"
        return 1
    fi
    
    # Validate required environment variables
    source .env.production
    
    required_vars=(
        "MONGODB_URI"
        "JWT_SECRET"
        "CLOUDINARY_CLOUD_NAME"
        "CLOUDINARY_API_KEY"
        "CLOUDINARY_API_SECRET"
        "SMTP_HOST"
        "SMTP_USER"
        "SMTP_PASS"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_status "Environment configuration validated!"
}

# Build application
build_application() {
    print_status "Building application..."
    
    # Clean previous builds
    pnpm clean
    
    # Install dependencies
    pnpm install --frozen-lockfile --prod=false
    
    # Run linting and tests
    print_status "Running quality checks..."
    pnpm lint
    pnpm test
    
    # Build all packages
    print_status "Building packages..."
    pnpm build:prod
    
    print_status "Application built successfully!"
}

# Build Docker images
build_docker_images() {
    print_status "Building Docker images..."
    
    # Get the current git commit hash
    GIT_COMMIT=$(git rev-parse --short HEAD)
    BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    VERSION=$(node -p "require('./package.json').version")
    
    # Build backend image
    print_status "Building backend Docker image..."
    docker build \
        --file packages/backend/Dockerfile \
        --tag "${DOCKER_REGISTRY}/${APP_NAME}-backend:${VERSION}" \
        --tag "${DOCKER_REGISTRY}/${APP_NAME}-backend:latest" \
        --build-arg GIT_COMMIT="${GIT_COMMIT}" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VERSION="${VERSION}" \
        .
    
    # Build frontend image
    print_status "Building frontend Docker image..."
    docker build \
        --file packages/frontend/Dockerfile \
        --tag "${DOCKER_REGISTRY}/${APP_NAME}-frontend:${VERSION}" \
        --tag "${DOCKER_REGISTRY}/${APP_NAME}-frontend:latest" \
        --build-arg GIT_COMMIT="${GIT_COMMIT}" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VERSION="${VERSION}" \
        .
    
    print_status "Docker images built successfully!"
}

# Push Docker images to registry
push_docker_images() {
    print_status "Pushing Docker images to registry..."
    
    VERSION=$(node -p "require('./package.json').version")
    
    # Push backend images
    docker push "${DOCKER_REGISTRY}/${APP_NAME}-backend:${VERSION}"
    docker push "${DOCKER_REGISTRY}/${APP_NAME}-backend:latest"
    
    # Push frontend images
    docker push "${DOCKER_REGISTRY}/${APP_NAME}-frontend:${VERSION}"
    docker push "${DOCKER_REGISTRY}/${APP_NAME}-frontend:latest"
    
    print_status "Docker images pushed successfully!"
}

# Deploy application
deploy_application() {
    print_status "Deploying application..."
    
    # Create required directories
    mkdir -p ./data/mongodb
    mkdir -p ./data/redis
    mkdir -p ./data/prometheus
    mkdir -p ./data/grafana
    mkdir -p ./logs
    
    # Set proper permissions
    chmod 755 ./data/mongodb
    chmod 755 ./data/redis
    chmod 755 ./logs
    
    # Copy production docker-compose file
    cp docker-compose.prod.yml docker-compose.yml
    
    # Pull latest images
    docker-compose pull
    
    # Stop existing containers
    docker-compose down
    
    # Start application stack
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    check_services_health
    
    print_status "Application deployed successfully!"
}

# Check services health
check_services_health() {
    print_status "Checking services health..."
    
    # Wait for backend to be ready
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "http://localhost:3000/health" > /dev/null; then
            print_status "Backend service is healthy!"
            break
        fi
        
        attempt=$((attempt + 1))
        print_status "Waiting for backend service... (attempt $attempt/$max_attempts)"
        sleep 10
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Backend service failed to start properly!"
        docker-compose logs backend
        exit 1
    fi
    
    # Check frontend
    if curl -f -s "http://localhost:80" > /dev/null; then
        print_status "Frontend service is healthy!"
    else
        print_warning "Frontend service might not be ready yet"
    fi
    
    # Check MongoDB
    if docker-compose exec -T mongo mongo --eval "db.adminCommand('ismaster')" > /dev/null; then
        print_status "MongoDB service is healthy!"
    else
        print_warning "MongoDB service might not be ready yet"
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        print_status "Redis service is healthy!"
    else
        print_warning "Redis service might not be ready yet"
    fi
}

# Setup SSL certificates (Let's Encrypt)
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if command -v certbot &> /dev/null; then
        # Stop nginx temporarily
        docker-compose stop nginx
        
        # Get SSL certificate
        certbot certonly --standalone \
            --email "admin@${PRODUCTION_DOMAIN}" \
            --agree-tos \
            --no-eff-email \
            -d "${PRODUCTION_DOMAIN}" \
            -d "api.${PRODUCTION_DOMAIN}"
        
        # Restart nginx
        docker-compose start nginx
        
        print_status "SSL certificates configured!"
    else
        print_warning "Certbot not installed. SSL certificates not configured."
        print_warning "Please install certbot and run: ./deploy.sh ssl"
    fi
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring dashboards..."
    
    # Check if Grafana is running
    if docker-compose ps | grep -q "grafana"; then
        print_status "Grafana is running at http://localhost:3001"
        print_status "Default credentials: admin/admin"
        print_status "Please change the default password after first login"
    fi
    
    # Check if Prometheus is running
    if docker-compose ps | grep -q "prometheus"; then
        print_status "Prometheus is running at http://localhost:9090"
    fi
    
    print_status "Monitoring setup complete!"
}

# Backup database
backup_database() {
    print_status "Creating database backup..."
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # MongoDB backup
    docker-compose exec -T mongo mongodump --out /tmp/backup
    docker-compose exec -T mongo tar -czf /tmp/mongodb_backup.tar.gz /tmp/backup
    docker cp "$(docker-compose ps -q mongo):/tmp/mongodb_backup.tar.gz" "$BACKUP_DIR/"
    
    print_status "Database backup created at $BACKUP_DIR"
}

# Show status
show_status() {
    print_status "Application Status:"
    docker-compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "  Frontend: http://localhost:80"
    echo "  Backend API: http://localhost:3000"
    echo "  Health Check: http://localhost:3000/health"
    echo "  Metrics: http://localhost:3000/metrics"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3001"
    
    echo ""
    print_status "Logs:"
    echo "  View all logs: docker-compose logs"
    echo "  View backend logs: docker-compose logs backend"
    echo "  View frontend logs: docker-compose logs frontend"
    echo "  Follow logs: docker-compose logs -f"
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "check")
            check_prerequisites
            ;;
        "build")
            check_prerequisites
            setup_environment
            build_application
            build_docker_images
            ;;
        "deploy")
            check_prerequisites
            setup_environment
            build_application
            build_docker_images
            deploy_application
            setup_monitoring
            show_status
            ;;
        "ssl")
            setup_ssl
            ;;
        "backup")
            backup_database
            ;;
        "status")
            show_status
            ;;
        "logs")
            docker-compose logs -f
            ;;
        "stop")
            print_status "Stopping services..."
            docker-compose down
            ;;
        "restart")
            print_status "Restarting services..."
            docker-compose restart
            ;;
        "update")
            print_status "Updating application..."
            git pull
            build_application
            build_docker_images
            docker-compose up -d
            ;;
        *)
            echo "Usage: $0 {check|build|deploy|ssl|backup|status|logs|stop|restart|update}"
            echo ""
            echo "Commands:"
            echo "  check   - Check prerequisites"
            echo "  build   - Build application and Docker images"
            echo "  deploy  - Full deployment (default)"
            echo "  ssl     - Setup SSL certificates"
            echo "  backup  - Create database backup"
            echo "  status  - Show application status"
            echo "  logs    - Show application logs"
            echo "  stop    - Stop all services"
            echo "  restart - Restart all services"
            echo "  update  - Update application from git"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"