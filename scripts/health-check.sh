#!/bin/bash

# =============================================================================
# Health Check and Monitoring Script
# Event Management Portal - Service health validation and alerting
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
ENVIRONMENT="${1:-staging}"
CHECK_TYPE="${2:-full}"
ALERT_ON_FAILURE="${ALERT_ON_FAILURE:-true}"
TIMEOUT="${TIMEOUT:-30}"
RETRY_COUNT="${RETRY_COUNT:-3}"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Environment configuration
declare -A ENV_CONFIGS
ENV_CONFIGS=(
    ["development:health_url"]="http://localhost:3000/health"
    ["development:api_url"]="http://localhost:3000/api/v1"
    ["development:frontend_url"]="http://localhost:3001"
    
    ["staging:health_url"]="https://staging.eventmanagement.com/health"
    ["staging:api_url"]="https://staging.eventmanagement.com/api/v1"
    ["staging:frontend_url"]="https://staging.eventmanagement.com"
    
    ["production:health_url"]="https://eventmanagement.com/health"
    ["production:api_url"]="https://eventmanagement.com/api/v1"
    ["production:frontend_url"]="https://eventmanagement.com"
)

# Health check results
declare -A HEALTH_RESULTS

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${BLUE}[INFO]${NC} $message" ;;
        "SUCCESS")  echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
    esac
}

get_env_config() {
    local env=$1
    local key=$2
    echo "${ENV_CONFIGS["${env}:${key}"]:-}"
}

make_request() {
    local url=$1
    local timeout=${2:-$TIMEOUT}
    local retry_count=${3:-$RETRY_COUNT}
    local method=${4:-GET}
    
    for ((i=1; i<=retry_count; i++)); do
        if curl -s -m "$timeout" -X "$method" -o /dev/null -w "%{http_code}" "$url"; then
            return 0
        fi
        
        if [ $i -lt $retry_count ]; then
            log "WARN" "Request failed, retrying in 5s (attempt $i/$retry_count)"
            sleep 5
        fi
    done
    
    return 1
}

# =============================================================================
# Health Check Functions
# =============================================================================

check_application_health() {
    log "INFO" "Checking application health..."
    
    local health_url=$(get_env_config "$ENVIRONMENT" "health_url")
    local response_code=$(make_request "$health_url" "$TIMEOUT" "$RETRY_COUNT")
    
    if [ "$response_code" = "200" ]; then
        log "SUCCESS" "Application health check passed"
        HEALTH_RESULTS["application"]="healthy"
        return 0
    else
        log "ERROR" "Application health check failed (HTTP $response_code)"
        HEALTH_RESULTS["application"]="unhealthy"
        return 1
    fi
}

check_api_health() {
    log "INFO" "Checking API health..."
    
    local api_url=$(get_env_config "$ENVIRONMENT" "api_url")
    local health_endpoint="${api_url}/health"
    local response_code=$(make_request "$health_endpoint" "$TIMEOUT" "$RETRY_COUNT")
    
    if [ "$response_code" = "200" ]; then
        log "SUCCESS" "API health check passed"
        HEALTH_RESULTS["api"]="healthy"
        
        # Test API functionality
        check_api_functionality "$api_url"
        return $?
    else
        log "ERROR" "API health check failed (HTTP $response_code)"
        HEALTH_RESULTS["api"]="unhealthy"
        return 1
    fi
}

check_api_functionality() {
    local api_url=$1
    
    log "INFO" "Testing API functionality..."
    
    # Test events endpoint
    local events_response=$(make_request "${api_url}/events?limit=1" "$TIMEOUT" 1)
    if [ "$events_response" != "200" ]; then
        log "WARN" "Events API endpoint not responding properly"
        HEALTH_RESULTS["api_functionality"]="degraded"
        return 1
    fi
    
    # Test clubs endpoint
    local clubs_response=$(make_request "${api_url}/clubs?limit=1" "$TIMEOUT" 1)
    if [ "$clubs_response" != "200" ]; then
        log "WARN" "Clubs API endpoint not responding properly"
        HEALTH_RESULTS["api_functionality"]="degraded"
        return 1
    fi
    
    log "SUCCESS" "API functionality tests passed"
    HEALTH_RESULTS["api_functionality"]="healthy"
    return 0
}

check_frontend_health() {
    log "INFO" "Checking frontend health..."
    
    local frontend_url=$(get_env_config "$ENVIRONMENT" "frontend_url")
    local response_code=$(make_request "$frontend_url" "$TIMEOUT" "$RETRY_COUNT")
    
    if [ "$response_code" = "200" ]; then
        log "SUCCESS" "Frontend health check passed"
        HEALTH_RESULTS["frontend"]="healthy"
        return 0
    else
        log "ERROR" "Frontend health check failed (HTTP $response_code)"
        HEALTH_RESULTS["frontend"]="unhealthy"
        return 1
    fi
}

check_database_connectivity() {
    log "INFO" "Checking database connectivity..."
    
    # Test database through API endpoint
    local api_url=$(get_env_config "$ENVIRONMENT" "api_url")
    local db_test_url="${api_url}/health/database"
    
    local response_code=$(make_request "$db_test_url" "$TIMEOUT" "$RETRY_COUNT")
    
    if [ "$response_code" = "200" ]; then
        log "SUCCESS" "Database connectivity check passed"
        HEALTH_RESULTS["database"]="healthy"
        return 0
    else
        log "ERROR" "Database connectivity check failed"
        HEALTH_RESULTS["database"]="unhealthy"
        return 1
    fi
}

check_redis_connectivity() {
    log "INFO" "Checking Redis connectivity..."
    
    # Test Redis through API endpoint
    local api_url=$(get_env_config "$ENVIRONMENT" "api_url")
    local redis_test_url="${api_url}/health/redis"
    
    local response_code=$(make_request "$redis_test_url" "$TIMEOUT" "$RETRY_COUNT")
    
    if [ "$response_code" = "200" ]; then
        log "SUCCESS" "Redis connectivity check passed"
        HEALTH_RESULTS["redis"]="healthy"
        return 0
    else
        log "ERROR" "Redis connectivity check failed"
        HEALTH_RESULTS["redis"]="unhealthy"
        return 1
    fi
}

check_external_services() {
    log "INFO" "Checking external services..."
    
    local api_url=$(get_env_config "$ENVIRONMENT" "api_url")
    
    # Check Cloudinary connectivity
    local cloudinary_test_url="${api_url}/health/cloudinary"
    local cloudinary_response=$(make_request "$cloudinary_test_url" "$TIMEOUT" 1)
    
    if [ "$cloudinary_response" = "200" ]; then
        log "SUCCESS" "Cloudinary connectivity check passed"
        HEALTH_RESULTS["cloudinary"]="healthy"
    else
        log "WARN" "Cloudinary connectivity check failed"
        HEALTH_RESULTS["cloudinary"]="unhealthy"
    fi
    
    # Check Email service
    local email_test_url="${api_url}/health/email"
    local email_response=$(make_request "$email_test_url" "$TIMEOUT" 1)
    
    if [ "$email_response" = "200" ]; then
        log "SUCCESS" "Email service check passed"
        HEALTH_RESULTS["email"]="healthy"
    else
        log "WARN" "Email service check failed"
        HEALTH_RESULTS["email"]="unhealthy"
    fi
}

check_ssl_certificates() {
    if [ "$ENVIRONMENT" = "development" ]; then
        log "INFO" "Skipping SSL check for development environment"
        return 0
    fi
    
    log "INFO" "Checking SSL certificates..."
    
    local domain
    case $ENVIRONMENT in
        "staging") domain="staging.eventmanagement.com" ;;
        "production") domain="eventmanagement.com" ;;
        *) return 0 ;;
    esac
    
    # Check SSL certificate expiration
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                     openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ $days_until_expiry -gt 30 ]; then
            log "SUCCESS" "SSL certificate valid (expires in $days_until_expiry days)"
            HEALTH_RESULTS["ssl"]="healthy"
        elif [ $days_until_expiry -gt 7 ]; then
            log "WARN" "SSL certificate expires soon ($days_until_expiry days)"
            HEALTH_RESULTS["ssl"]="warning"
        else
            log "ERROR" "SSL certificate expires very soon ($days_until_expiry days)"
            HEALTH_RESULTS["ssl"]="critical"
        fi
    else
        log "ERROR" "Failed to retrieve SSL certificate information"
        HEALTH_RESULTS["ssl"]="unhealthy"
    fi
}

check_performance_metrics() {
    log "INFO" "Checking performance metrics..."
    
    local frontend_url=$(get_env_config "$ENVIRONMENT" "frontend_url")
    
    # Measure response time
    local start_time=$(date +%s%N)
    local response_code=$(make_request "$frontend_url" 10 1)
    local end_time=$(date +%s%N)
    
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ "$response_code" = "200" ]; then
        if [ $response_time -lt 1000 ]; then
            log "SUCCESS" "Performance check passed (${response_time}ms)"
            HEALTH_RESULTS["performance"]="healthy"
        elif [ $response_time -lt 3000 ]; then
            log "WARN" "Performance degraded (${response_time}ms)"
            HEALTH_RESULTS["performance"]="warning"
        else
            log "ERROR" "Performance critical (${response_time}ms)"
            HEALTH_RESULTS["performance"]="critical"
        fi
    else
        log "ERROR" "Performance check failed - service unavailable"
        HEALTH_RESULTS["performance"]="unhealthy"
    fi
}

# =============================================================================
# Reporting Functions
# =============================================================================

generate_health_report() {
    local overall_status="healthy"
    local critical_issues=()
    local warnings=()
    
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    HEALTH CHECK REPORT                           ║"
    echo "╠══════════════════════════════════════════════════════════════════╣"
    echo "║ Environment: $ENVIRONMENT"
    echo "║ Timestamp: $(date)"
    echo "║ Check Type: $CHECK_TYPE"
    echo "╠══════════════════════════════════════════════════════════════════╣"
    
    for service in "${!HEALTH_RESULTS[@]}"; do
        local status="${HEALTH_RESULTS[$service]}"
        local icon="✅"
        
        case $status in
            "unhealthy") icon="❌"; overall_status="unhealthy"; critical_issues+=("$service") ;;
            "critical") icon="🔴"; overall_status="critical"; critical_issues+=("$service") ;;
            "warning") icon="⚠️"; warnings+=("$service") ;;
            "degraded") icon="⚠️"; warnings+=("$service") ;;
        esac
        
        printf "║ %-20s %s %s\n" "$service:" "$icon" "$status"
    done
    
    echo "╠══════════════════════════════════════════════════════════════════╣"
    echo "║ Overall Status: $overall_status"
    
    if [ ${#critical_issues[@]} -gt 0 ]; then
        echo "║ Critical Issues: ${critical_issues[*]}"
    fi
    
    if [ ${#warnings[@]} -gt 0 ]; then
        echo "║ Warnings: ${warnings[*]}"
    fi
    
    echo "╚══════════════════════════════════════════════════════════════════╝"
    
    # Return appropriate exit code
    case $overall_status in
        "unhealthy"|"critical") return 1 ;;
        *) return 0 ;;
    esac
}

send_health_alert() {
    local status=$1
    local message=$2
    
    if [ "$ALERT_ON_FAILURE" != "true" ]; then
        return 0
    fi
    
    # Send Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        send_slack_health_alert "$status" "$message"
    fi
    
    # Send email notification
    if [ -n "${ALERT_EMAIL_TO:-}" ]; then
        send_email_health_alert "$status" "$message"
    fi
}

send_slack_health_alert() {
    local status=$1
    local message=$2
    
    local color="danger"
    local emoji="❌"
    
    case $status in
        "warning") color="warning"; emoji="⚠️" ;;
        "healthy") color="good"; emoji="✅"; return 0 ;; # Don't send alerts for healthy status
    esac
    
    local payload=$(jq -n \
        --arg text "$emoji Health Check Alert - $ENVIRONMENT" \
        --arg color "$color" \
        --arg message "$message" \
        --arg environment "$ENVIRONMENT" \
        '{
            attachments: [{
                color: $color,
                title: $text,
                text: $message,
                fields: [
                    { title: "Environment", value: $environment, short: true },
                    { title: "Timestamp", value: now | strftime("%Y-%m-%d %H:%M:%S UTC"), short: true }
                ],
                footer: "Event Management Portal Health Monitor"
            }]
        }'
    )
    
    curl -s -X POST -H 'Content-type: application/json' \
         --data "$payload" \
         "$SLACK_WEBHOOK_URL" > /dev/null || true
}

# =============================================================================
# Main Execution Functions
# =============================================================================

run_basic_checks() {
    local failed_checks=0
    
    check_application_health || ((failed_checks++))
    check_api_health || ((failed_checks++))
    check_frontend_health || ((failed_checks++))
    
    return $failed_checks
}

run_full_checks() {
    local failed_checks=0
    
    # Basic checks
    check_application_health || ((failed_checks++))
    check_api_health || ((failed_checks++))
    check_frontend_health || ((failed_checks++))
    
    # Extended checks
    check_database_connectivity || ((failed_checks++))
    check_redis_connectivity || ((failed_checks++))
    check_external_services || ((failed_checks++))
    check_ssl_certificates || ((failed_checks++))
    check_performance_metrics || ((failed_checks++))
    
    return $failed_checks
}

show_help() {
    cat << EOF
Health Check and Monitoring Script
Event Management Portal

USAGE:
    $0 [ENVIRONMENT] [CHECK_TYPE] [OPTIONS]

ENVIRONMENTS:
    development  - Local development environment
    staging      - Staging environment
    production   - Production environment

CHECK_TYPES:
    basic        - Basic health checks (app, api, frontend)
    full         - Full health checks (includes database, external services, SSL, performance)
    quick        - Quick check (minimal timeout, single retry)

ENVIRONMENT VARIABLES:
    ALERT_ON_FAILURE    Send alerts on health check failure (true/false)
    TIMEOUT            Request timeout in seconds (default: 30)
    RETRY_COUNT        Number of retries for failed requests (default: 3)
    SLACK_WEBHOOK_URL  Slack webhook for alerts
    ALERT_EMAIL_TO     Email address for alerts

EXAMPLES:
    $0 staging
    $0 production full
    $0 development basic
    TIMEOUT=10 $0 staging quick

EOF
}

main() {
    # Parse arguments
    if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
        show_help
        exit 0
    fi
    
    # Validate environment
    if [[ ! " development staging production " =~ " $ENVIRONMENT " ]]; then
        log "ERROR" "Invalid environment: $ENVIRONMENT"
        exit 1
    fi
    
    log "INFO" "Starting health checks for $ENVIRONMENT environment"
    log "INFO" "Check type: $CHECK_TYPE"
    
    # Run appropriate checks
    case $CHECK_TYPE in
        "basic") run_basic_checks ;;
        "quick") TIMEOUT=10; RETRY_COUNT=1; run_basic_checks ;;
        "full"|*) run_full_checks ;;
    esac
    
    # Generate report and handle results
    if generate_health_report; then
        log "SUCCESS" "All health checks passed"
        exit 0
    else
        log "ERROR" "Health check failures detected"
        send_health_alert "critical" "Health check failures detected in $ENVIRONMENT environment"
        exit 1
    fi
}

# Run main function
main "$@"