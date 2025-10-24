#!/bin/bash

# Monitoring Stack Deployment Script
# This script deploys the complete monitoring infrastructure for Event Management Portal

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="event-management"
MONITORING_NETWORK="monitoring"
GRAFANA_PASSWORD="admin123"  # Change this in production

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        print_status "ERROR" "Docker is required but not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_status "ERROR" "Docker Compose is required but not installed"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_status "ERROR" "Docker is not running"
        exit 1
    fi
    
    print_status "SUCCESS" "Prerequisites check passed"
}

# Function to create necessary directories
create_directories() {
    print_status "INFO" "Creating monitoring directories..."
    
    local dirs=(
        "monitoring/prometheus/data"
        "monitoring/grafana/data"
        "monitoring/grafana/logs"
        "monitoring/alertmanager/data"
        "logs/monitoring"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "SUCCESS" "Created directory: $dir"
        fi
    done
    
    # Set proper permissions for Grafana
    chmod 777 monitoring/grafana/data monitoring/grafana/logs
    print_status "SUCCESS" "Set permissions for Grafana directories"
}

# Function to create monitoring network
create_network() {
    print_status "INFO" "Creating monitoring network..."
    
    if ! docker network ls | grep -q "$MONITORING_NETWORK"; then
        docker network create "$MONITORING_NETWORK"
        print_status "SUCCESS" "Created Docker network: $MONITORING_NETWORK"
    else
        print_status "INFO" "Network $MONITORING_NETWORK already exists"
    fi
}

# Function to validate configuration files
validate_configs() {
    print_status "INFO" "Validating configuration files..."
    
    local config_files=(
        "monitoring/prometheus/prometheus.yml"
        "monitoring/alertmanager/alertmanager.yml"
        "docker-compose.monitoring.yml"
    )
    
    for config_file in "${config_files[@]}"; do
        if [ ! -f "$config_file" ]; then
            print_status "ERROR" "Configuration file missing: $config_file"
            exit 1
        fi
        
        # Basic YAML validation for YAML files
        if [[ "$config_file" == *.yml ]] || [[ "$config_file" == *.yaml ]]; then
            if command -v python3 >/dev/null 2>&1; then
                if ! python3 -c "import yaml; yaml.safe_load(open('$config_file'))" >/dev/null 2>&1; then
                    print_status "ERROR" "Invalid YAML syntax in: $config_file"
                    exit 1
                fi
            fi
        fi
        
        print_status "SUCCESS" "Configuration valid: $config_file"
    done
}

# Function to pull Docker images
pull_images() {
    print_status "INFO" "Pulling Docker images..."
    
    local images=(
        "prom/prometheus:latest"
        "grafana/grafana:latest"
        "prom/alertmanager:latest"
        "prom/node-exporter:latest"
        "google/cadvisor:latest"
        "prom/blackbox-exporter:latest"
        "percona/mongodb_exporter:latest"
        "oliver006/redis_exporter:latest"
    )
    
    for image in "${images[@]}"; do
        print_status "INFO" "Pulling $image..."
        if docker pull "$image"; then
            print_status "SUCCESS" "Pulled $image"
        else
            print_status "ERROR" "Failed to pull $image"
            exit 1
        fi
    done
}

# Function to deploy monitoring stack
deploy_stack() {
    print_status "INFO" "Deploying monitoring stack..."
    
    # Stop existing containers if running
    if docker-compose -f docker-compose.monitoring.yml ps | grep -q "Up"; then
        print_status "INFO" "Stopping existing monitoring containers..."
        docker-compose -f docker-compose.monitoring.yml down
    fi
    
    # Start the monitoring stack
    print_status "INFO" "Starting monitoring containers..."
    if docker-compose -f docker-compose.monitoring.yml up -d; then
        print_status "SUCCESS" "Monitoring stack deployed successfully"
    else
        print_status "ERROR" "Failed to deploy monitoring stack"
        exit 1
    fi
    
    # Wait for services to be ready
    print_status "INFO" "Waiting for services to be ready..."
    sleep 30
}

# Function to verify deployment
verify_deployment() {
    print_status "INFO" "Verifying deployment..."
    
    local services=(
        "prometheus:9090"
        "grafana:3000"
        "alertmanager:9093"
        "node-exporter:9100"
    )
    
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local name
        local port
        name=$(echo "$service" | cut -d: -f1)
        port=$(echo "$service" | cut -d: -f2)
        
        local max_attempts=10
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if curl -s "http://localhost:$port" >/dev/null 2>&1; then
                print_status "SUCCESS" "$name is healthy (port $port)"
                break
            else
                if [ $attempt -eq $max_attempts ]; then
                    print_status "ERROR" "$name is not responding (port $port)"
                    all_healthy=false
                else
                    print_status "INFO" "Waiting for $name... (attempt $attempt/$max_attempts)"
                    sleep 10
                fi
            fi
            ((attempt++))
        done
    done
    
    if [ "$all_healthy" = true ]; then
        print_status "SUCCESS" "All services are healthy"
    else
        print_status "ERROR" "Some services are not healthy"
        print_status "INFO" "Check logs with: docker-compose -f docker-compose.monitoring.yml logs"
        return 1
    fi
}

# Function to setup Grafana
setup_grafana() {
    print_status "INFO" "Setting up Grafana..."
    
    # Wait for Grafana to be ready
    local max_attempts=20
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
            break
        else
            print_status "INFO" "Waiting for Grafana to be ready... (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_status "ERROR" "Grafana did not become ready in time"
        return 1
    fi
    
    # Change default password
    print_status "INFO" "Updating Grafana admin password..."
    local change_password_response
    change_password_response=$(curl -s -X PUT \
        -H "Content-Type: application/json" \
        -u "admin:admin" \
        -d "{\"oldPassword\": \"admin\", \"newPassword\": \"$GRAFANA_PASSWORD\", \"confirmNew\": \"$GRAFANA_PASSWORD\"}" \
        http://localhost:3000/api/user/password)
    
    if echo "$change_password_response" | grep -q "Password changed"; then
        print_status "SUCCESS" "Grafana admin password updated"
    else
        print_status "WARNING" "Password may already be changed or update failed"
    fi
    
    print_status "SUCCESS" "Grafana setup completed"
}

# Function to import Grafana dashboards
import_dashboards() {
    print_status "INFO" "Importing Grafana dashboards..."
    
    local dashboard_files=(
        "monitoring/grafana/dashboards/application-overview.json"
        "monitoring/grafana/dashboards/business-metrics.json"
        "monitoring/grafana/dashboards/infrastructure/infrastructure-overview.json"
    )
    
    for dashboard_file in "${dashboard_files[@]}"; do
        if [ -f "$dashboard_file" ]; then
            local dashboard_name
            dashboard_name=$(basename "$dashboard_file" .json)
            
            print_status "INFO" "Importing dashboard: $dashboard_name"
            
            local import_response
            import_response=$(curl -s -X POST \
                -H "Content-Type: application/json" \
                -u "admin:$GRAFANA_PASSWORD" \
                -d @"$dashboard_file" \
                http://localhost:3000/api/dashboards/db)
            
            if echo "$import_response" | grep -q '"status":"success"'; then
                print_status "SUCCESS" "Imported dashboard: $dashboard_name"
            else
                print_status "WARNING" "Failed to import dashboard: $dashboard_name"
            fi
        else
            print_status "WARNING" "Dashboard file not found: $dashboard_file"
        fi
    done
}

# Function to test alerting
test_alerting() {
    print_status "INFO" "Testing alerting configuration..."
    
    # Check Prometheus rules
    local rules_response
    rules_response=$(curl -s http://localhost:9090/api/v1/rules)
    
    if echo "$rules_response" | grep -q '"status":"success"'; then
        local rules_count
        rules_count=$(echo "$rules_response" | jq '.data.groups[].rules | length' | awk '{sum += $1} END {print sum}')
        print_status "SUCCESS" "Loaded $rules_count alert rules"
    else
        print_status "ERROR" "Failed to load alert rules"
    fi
    
    # Check Alertmanager configuration
    local alertmanager_status
    alertmanager_status=$(curl -s http://localhost:9093/api/v1/status)
    
    if echo "$alertmanager_status" | grep -q '"status":"success"'; then
        print_status "SUCCESS" "Alertmanager configuration is valid"
    else
        print_status "ERROR" "Alertmanager configuration has issues"
    fi
}

# Function to create monitoring script shortcuts
create_shortcuts() {
    print_status "INFO" "Creating monitoring shortcuts..."
    
    # Create monitoring control script
    cat > scripts/monitoring-control.sh << 'EOF'
#!/bin/bash

# Monitoring Control Script

case "$1" in
    start)
        echo "Starting monitoring stack..."
        docker-compose -f docker-compose.monitoring.yml up -d
        ;;
    stop)
        echo "Stopping monitoring stack..."
        docker-compose -f docker-compose.monitoring.yml down
        ;;
    restart)
        echo "Restarting monitoring stack..."
        docker-compose -f docker-compose.monitoring.yml restart
        ;;
    status)
        echo "Monitoring stack status:"
        docker-compose -f docker-compose.monitoring.yml ps
        ;;
    logs)
        service=${2:-}
        if [ -n "$service" ]; then
            docker-compose -f docker-compose.monitoring.yml logs -f "$service"
        else
            docker-compose -f docker-compose.monitoring.yml logs -f
        fi
        ;;
    validate)
        echo "Running monitoring validation..."
        ./scripts/validate-monitoring.sh
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs [service]|validate}"
        exit 1
        ;;
esac
EOF

    chmod +x scripts/monitoring-control.sh
    print_status "SUCCESS" "Created monitoring control script"
    
    # Create backup script
    cat > scripts/backup-monitoring.sh << 'EOF'
#!/bin/bash

# Monitoring Backup Script

BACKUP_DIR="backups/monitoring/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating monitoring backup in $BACKUP_DIR..."

# Backup Grafana data
docker cp grafana:/var/lib/grafana "$BACKUP_DIR/grafana-data"
echo "✅ Grafana data backed up"

# Backup Prometheus data
docker cp prometheus:/prometheus "$BACKUP_DIR/prometheus-data"
echo "✅ Prometheus data backed up"

# Backup configurations
cp -r monitoring "$BACKUP_DIR/monitoring-configs"
echo "✅ Configuration files backed up"

# Create backup info
cat > "$BACKUP_DIR/backup-info.txt" << EOL
Backup created: $(date)
Grafana version: $(docker exec grafana grafana-server -v 2>/dev/null || echo "Unknown")
Prometheus version: $(docker exec prometheus prometheus --version 2>/dev/null | head -1 || echo "Unknown")
EOL

echo "✅ Backup completed: $BACKUP_DIR"
EOF

    chmod +x scripts/backup-monitoring.sh
    print_status "SUCCESS" "Created backup script"
}

# Function to display deployment summary
display_summary() {
    echo ""
    echo "========================================="
    echo "   MONITORING DEPLOYMENT COMPLETED! 🎉   "
    echo "========================================="
    echo ""
    echo "Access URLs:"
    echo "📊 Grafana Dashboard:    http://localhost:3000"
    echo "   Username: admin"
    echo "   Password: $GRAFANA_PASSWORD"
    echo ""
    echo "📈 Prometheus:           http://localhost:9090"
    echo "🚨 Alertmanager:         http://localhost:9093"
    echo "💻 Node Exporter:        http://localhost:9100"
    echo "📦 cAdvisor:             http://localhost:8080"
    echo ""
    echo "Useful Commands:"
    echo "• Control monitoring:    ./scripts/monitoring-control.sh {start|stop|restart|status}"
    echo "• View logs:             ./scripts/monitoring-control.sh logs [service]"
    echo "• Validate setup:        ./scripts/validate-monitoring.sh"
    echo "• Backup data:           ./scripts/backup-monitoring.sh"
    echo ""
    echo "Available Dashboards:"
    echo "• Application Overview   - Main application metrics and health"
    echo "• Business Metrics      - User engagement and business KPIs"
    echo "• Infrastructure        - System and container metrics"
    echo ""
    echo "Next Steps:"
    echo "1. 📧 Configure notification channels (Slack, Email, PagerDuty)"
    echo "2. 🎯 Customize alert thresholds for your environment"
    echo "3. 📚 Review the monitoring runbook: documentation/MONITORING_RUNBOOK.md"
    echo "4. 🔒 Update default passwords and secure the setup"
    echo "5. 📋 Set up regular backup procedures"
    echo ""
    print_status "SUCCESS" "Monitoring infrastructure is ready for production! 🚀"
}

# Main execution function
main() {
    echo "🚀 Starting Event Management Portal Monitoring Deployment"
    echo "==========================================================="
    echo ""
    
    check_prerequisites
    create_directories
    create_network
    validate_configs
    pull_images
    deploy_stack
    
    if verify_deployment; then
        setup_grafana
        import_dashboards
        test_alerting
        create_shortcuts
        display_summary
    else
        print_status "ERROR" "Deployment verification failed"
        print_status "INFO" "Check container logs for more details:"
        print_status "INFO" "docker-compose -f docker-compose.monitoring.yml logs"
        exit 1
    fi
}

# Cleanup function for script interruption
cleanup() {
    echo ""
    print_status "WARNING" "Deployment interrupted"
    print_status "INFO" "Cleaning up..."
    docker-compose -f docker-compose.monitoring.yml down 2>/dev/null || true
    exit 1
}

# Set trap for cleanup
trap cleanup INT TERM

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    print_status "WARNING" "Running as root is not recommended"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run main function
main "$@"