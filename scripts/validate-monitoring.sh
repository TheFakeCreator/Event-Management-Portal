#!/bin/bash

# Monitoring Stack Validation Script
# This script validates the complete monitoring infrastructure setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3000"
ALERTMANAGER_URL="http://localhost:9093"
GRAFANA_USER="admin"
GRAFANA_PASS="admin123"

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

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "^$expected_status$"; then
        print_status "SUCCESS" "$name is accessible ($url)"
        return 0
    else
        print_status "ERROR" "$name is not accessible ($url)"
        return 1
    fi
}

# Function to check Docker containers
check_containers() {
    print_status "INFO" "Checking Docker containers..."
    
    local required_containers=(
        "prometheus"
        "grafana"
        "alertmanager"
        "node-exporter"
        "cadvisor"
        "blackbox-exporter"
    )
    
    local all_running=true
    
    for container in "${required_containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" --format "table {{.Names}}" | grep -q "$container"; then
            print_status "SUCCESS" "Container $container is running"
        else
            print_status "ERROR" "Container $container is not running"
            all_running=false
        fi
    done
    
    return $all_running
}

# Function to check Prometheus targets
check_prometheus_targets() {
    print_status "INFO" "Checking Prometheus targets..."
    
    local targets_response
    targets_response=$(curl -s "$PROMETHEUS_URL/api/v1/targets" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        print_status "ERROR" "Cannot connect to Prometheus API"
        return 1
    fi
    
    local up_targets
    local total_targets
    up_targets=$(echo "$targets_response" | jq '.data.activeTargets[] | select(.health == "up")' | jq -s 'length')
    total_targets=$(echo "$targets_response" | jq '.data.activeTargets | length')
    
    print_status "INFO" "Targets status: $up_targets/$total_targets up"
    
    # Check specific important targets
    local important_jobs=("prometheus" "backend" "node-exporter" "cadvisor")
    
    for job in "${important_jobs[@]}"; do
        local job_status
        job_status=$(echo "$targets_response" | jq -r ".data.activeTargets[] | select(.labels.job == \"$job\") | .health")
        
        if [ "$job_status" = "up" ]; then
            print_status "SUCCESS" "Job '$job' is healthy"
        elif [ "$job_status" = "down" ]; then
            print_status "ERROR" "Job '$job' is down"
        else
            print_status "WARNING" "Job '$job' not found or unknown status"
        fi
    done
}

# Function to check Prometheus rules
check_prometheus_rules() {
    print_status "INFO" "Checking Prometheus alert rules..."
    
    local rules_response
    rules_response=$(curl -s "$PROMETHEUS_URL/api/v1/rules" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        print_status "ERROR" "Cannot fetch Prometheus rules"
        return 1
    fi
    
    local total_rules
    total_rules=$(echo "$rules_response" | jq '.data.groups[].rules | length' | awk '{sum += $1} END {print sum}')
    
    print_status "INFO" "Total alert rules loaded: $total_rules"
    
    # Check for critical alert rules
    local critical_rules=("EventManagement_HighErrorRate" "EventManagement_ServiceDown" "MongoDB_Down")
    
    for rule in "${critical_rules[@]}"; do
        local rule_exists
        rule_exists=$(echo "$rules_response" | jq -r ".data.groups[].rules[] | select(.name == \"$rule\") | .name")
        
        if [ "$rule_exists" = "$rule" ]; then
            print_status "SUCCESS" "Critical rule '$rule' is loaded"
        else
            print_status "ERROR" "Critical rule '$rule' is missing"
        fi
    done
}

# Function to check Alertmanager
check_alertmanager() {
    print_status "INFO" "Checking Alertmanager..."
    
    # Check Alertmanager health
    if ! check_endpoint "$ALERTMANAGER_URL/-/healthy" "Alertmanager health"; then
        return 1
    fi
    
    # Check configuration
    local config_response
    config_response=$(curl -s "$ALERTMANAGER_URL/api/v1/status" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local config_status
        config_status=$(echo "$config_response" | jq -r '.status')
        print_status "SUCCESS" "Alertmanager configuration is valid"
    else
        print_status "ERROR" "Cannot fetch Alertmanager status"
        return 1
    fi
    
    # Check receivers
    local receivers_count
    receivers_count=$(curl -s "$ALERTMANAGER_URL/api/v1/receivers" 2>/dev/null | jq '. | length')
    print_status "INFO" "Configured receivers: $receivers_count"
}

# Function to check Grafana
check_grafana() {
    print_status "INFO" "Checking Grafana..."
    
    # Check Grafana health
    if ! check_endpoint "$GRAFANA_URL/api/health" "Grafana health"; then
        return 1
    fi
    
    # Check datasources
    local datasources_response
    datasources_response=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/datasources" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local prometheus_ds
        prometheus_ds=$(echo "$datasources_response" | jq '.[] | select(.type == "prometheus") | .name')
        
        if [ -n "$prometheus_ds" ]; then
            print_status "SUCCESS" "Prometheus datasource is configured"
        else
            print_status "ERROR" "Prometheus datasource is missing"
        fi
        
        local total_datasources
        total_datasources=$(echo "$datasources_response" | jq '. | length')
        print_status "INFO" "Total datasources: $total_datasources"
    else
        print_status "ERROR" "Cannot fetch Grafana datasources"
    fi
    
    # Check dashboards
    local dashboards_response
    dashboards_response=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/search?type=dash-db" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local total_dashboards
        total_dashboards=$(echo "$dashboards_response" | jq '. | length')
        print_status "INFO" "Total dashboards: $total_dashboards"
        
        # Check for important dashboards
        local important_dashboards=("Application Overview" "Infrastructure Overview" "Business Metrics")
        
        for dashboard in "${important_dashboards[@]}"; do
            local dashboard_exists
            dashboard_exists=$(echo "$dashboards_response" | jq -r ".[] | select(.title == \"$dashboard\") | .title")
            
            if [ "$dashboard_exists" = "$dashboard" ]; then
                print_status "SUCCESS" "Dashboard '$dashboard' exists"
            else
                print_status "WARNING" "Dashboard '$dashboard' is missing"
            fi
        done
    fi
}

# Function to test metrics collection
test_metrics_collection() {
    print_status "INFO" "Testing metrics collection..."
    
    # Test basic Prometheus metrics
    local metrics_tests=(
        "up"
        "prometheus_notifications_total"
        "http_requests_total"
        "node_cpu_seconds_total"
    )
    
    for metric in "${metrics_tests[@]}"; do
        local query_result
        query_result=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=$metric" | jq -r '.data.result | length')
        
        if [ "$query_result" -gt 0 ]; then
            print_status "SUCCESS" "Metric '$metric' is being collected"
        else
            print_status "WARNING" "Metric '$metric' has no data"
        fi
    done
}

# Function to test alerting pipeline
test_alerting_pipeline() {
    print_status "INFO" "Testing alerting pipeline..."
    
    # Check if any alerts are currently firing
    local active_alerts
    active_alerts=$(curl -s "$PROMETHEUS_URL/api/v1/alerts" | jq '.data.alerts[] | select(.state == "firing") | length' | wc -l)
    
    print_status "INFO" "Currently firing alerts: $active_alerts"
    
    # Test Alertmanager connectivity from Prometheus
    local alertmanager_config
    alertmanager_config=$(curl -s "$PROMETHEUS_URL/api/v1/status/config" | jq -r '.data.yaml' | grep -c "alertmanagers")
    
    if [ "$alertmanager_config" -gt 0 ]; then
        print_status "SUCCESS" "Prometheus is configured to send alerts to Alertmanager"
    else
        print_status "ERROR" "Prometheus alerting configuration is missing"
    fi
}

# Function to check resource usage
check_resource_usage() {
    print_status "INFO" "Checking resource usage..."
    
    # Check container resource usage
    local containers=("prometheus" "grafana" "alertmanager")
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --format "table {{.Names}}" | grep -q "$container"; then
            local stats
            stats=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep "$container")
            
            if [ -n "$stats" ]; then
                print_status "INFO" "$container resources: $stats"
            fi
        fi
    done
}

# Function to validate configuration files
validate_configurations() {
    print_status "INFO" "Validating configuration files..."
    
    local config_files=(
        "monitoring/prometheus/prometheus.yml"
        "monitoring/prometheus/alerts/application-alerts.yml"
        "monitoring/prometheus/alerts/infrastructure-alerts.yml"
        "monitoring/alertmanager/alertmanager.yml"
        "docker-compose.monitoring.yml"
    )
    
    for config_file in "${config_files[@]}"; do
        if [ -f "$config_file" ]; then
            print_status "SUCCESS" "Configuration file exists: $config_file"
            
            # Basic YAML validation
            if command -v yamllint >/dev/null 2>&1; then
                if yamllint "$config_file" >/dev/null 2>&1; then
                    print_status "SUCCESS" "YAML syntax valid: $config_file"
                else
                    print_status "ERROR" "YAML syntax invalid: $config_file"
                fi
            fi
        else
            print_status "ERROR" "Configuration file missing: $config_file"
        fi
    done
}

# Function to check network connectivity
check_network_connectivity() {
    print_status "INFO" "Checking network connectivity..."
    
    # Check if monitoring network exists
    if docker network ls | grep -q "monitoring"; then
        print_status "SUCCESS" "Monitoring network exists"
    else
        print_status "WARNING" "Monitoring network not found"
    fi
    
    # Test internal connectivity
    local connectivity_tests=(
        "prometheus:9090"
        "grafana:3000"
        "alertmanager:9093"
        "node-exporter:9100"
    )
    
    for test in "${connectivity_tests[@]}"; do
        local host
        local port
        host=$(echo "$test" | cut -d: -f1)
        port=$(echo "$test" | cut -d: -f2)
        
        if docker exec prometheus nc -z "$host" "$port" 2>/dev/null; then
            print_status "SUCCESS" "Connectivity OK: prometheus -> $test"
        else
            print_status "WARNING" "Connectivity issue: prometheus -> $test"
        fi
    done
}

# Function to generate summary report
generate_report() {
    local total_checks=$1
    local passed_checks=$2
    local failed_checks=$((total_checks - passed_checks))
    
    echo ""
    echo "========================================="
    echo "     MONITORING VALIDATION SUMMARY      "
    echo "========================================="
    echo ""
    printf "Total Checks: %d\n" "$total_checks"
    printf "Passed: %d\n" "$passed_checks"
    printf "Failed: %d\n" "$failed_checks"
    echo ""
    
    if [ "$failed_checks" -eq 0 ]; then
        print_status "SUCCESS" "All monitoring components are healthy! 🎉"
        echo ""
        echo "Your monitoring stack is ready for production!"
        echo ""
        echo "Next steps:"
        echo "1. Configure notification channels (Slack, email, PagerDuty)"
        echo "2. Set up backup procedures"
        echo "3. Train team on monitoring procedures"
        echo "4. Create custom dashboards for your specific needs"
    else
        print_status "ERROR" "Some checks failed. Please review the issues above."
        echo ""
        echo "Common troubleshooting steps:"
        echo "1. Check if all containers are running: docker-compose -f docker-compose.monitoring.yml ps"
        echo "2. Check container logs: docker logs <container-name>"
        echo "3. Verify network connectivity between containers"
        echo "4. Ensure configuration files are valid"
    fi
    
    echo ""
    echo "Useful URLs:"
    echo "- Prometheus: $PROMETHEUS_URL"
    echo "- Grafana: $GRAFANA_URL (admin/admin123)"
    echo "- Alertmanager: $ALERTMANAGER_URL"
    echo ""
}

# Main execution
main() {
    echo "🔍 Starting Monitoring Stack Validation..."
    echo "=========================================="
    echo ""
    
    local checks_total=0
    local checks_passed=0
    
    # Run all checks
    if check_containers; then ((checks_passed++)); fi
    ((checks_total++))
    
    if check_endpoint "$PROMETHEUS_URL/-/healthy" "Prometheus"; then ((checks_passed++)); fi
    ((checks_total++))
    
    if check_endpoint "$GRAFANA_URL/api/health" "Grafana"; then ((checks_passed++)); fi
    ((checks_total++))
    
    if check_endpoint "$ALERTMANAGER_URL/-/healthy" "Alertmanager"; then ((checks_passed++)); fi
    ((checks_total++))
    
    if check_prometheus_targets; then ((checks_passed++)); fi
    ((checks_total++))
    
    if check_prometheus_rules; then ((checks_passed++)); fi
    ((checks_total++))
    
    if check_alertmanager; then ((checks_passed++)); fi
    ((checks_total++))
    
    if check_grafana; then ((checks_passed++)); fi
    ((checks_total++))
    
    test_metrics_collection
    ((checks_total++))
    
    test_alerting_pipeline
    ((checks_total++))
    
    check_resource_usage
    
    validate_configurations
    ((checks_total++))
    
    check_network_connectivity
    ((checks_total++))
    
    # Generate final report
    generate_report "$checks_total" "$checks_passed"
    
    # Exit with appropriate code
    if [ "$checks_passed" -eq "$checks_total" ]; then
        exit 0
    else
        exit 1
    fi
}

# Check dependencies
if ! command -v curl >/dev/null 2>&1; then
    print_status "ERROR" "curl is required but not installed"
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    print_status "ERROR" "jq is required but not installed"
    exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
    print_status "ERROR" "docker is required but not installed"
    exit 1
fi

# Run main function
main "$@"