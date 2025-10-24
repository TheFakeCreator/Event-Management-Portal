#!/bin/bash

# =============================================================================
# Enhanced Deployment Manager
# Event Management Portal - Advanced Multi-Environment Deployment
# =============================================================================

set -euo pipefail

# Script metadata
SCRIPT_VERSION="2.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
DEPLOY_LOG_DIR="$PROJECT_ROOT/logs/deployment"
BACKUP_DIR="$PROJECT_ROOT/backups"
CONFIG_DIR="$PROJECT_ROOT/deployment"

# Default values
ENVIRONMENT="${1:-staging}"
DEPLOY_MODE="${2:-standard}"
FORCE_DEPLOY="${FORCE_DEPLOY:-false}"
SKIP_BACKUP="${SKIP_BACKUP:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"
SKIP_HEALTH_CHECK="${SKIP_HEALTH_CHECK:-false}"
DRY_RUN="${DRY_RUN:-false}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# Environment configurations
declare -A ENV_CONFIGS
ENV_CONFIGS=(
    ["development:compose_file"]="docker-compose.yml"
    ["development:health_url"]="http://localhost:3000/health"
    ["development:domain"]="localhost"
    ["development:ssl_enabled"]="false"
    
    ["staging:compose_file"]="docker-compose.staging.yml"
    ["staging:health_url"]="https://staging.eventmanagement.com/health"
    ["staging:domain"]="staging.eventmanagement.com"
    ["staging:ssl_enabled"]="true"
    
    ["production:compose_file"]="docker-compose.prod.yml"
    ["production:health_url"]="https://eventmanagement.com/health"
    ["production:domain"]="eventmanagement.com"
    ["production:ssl_enabled"]="true"
)

# =============================================================================
# Logging and Output Functions
# =============================================================================

setup_logging() {
    mkdir -p "$DEPLOY_LOG_DIR"
    local log_file="$DEPLOY_LOG_DIR/deploy-$(date '+%Y%m%d_%H%M%S').log"
    exec 19>&2
    exec 2> >(tee -a "$log_file")
    echo "Log file: $log_file"
}

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  
            echo -e "${BLUE}[INFO]${NC} ${message}" >&19
            echo "[$timestamp] INFO: $message"
            ;;
        "SUCCESS")  
            echo -e "${GREEN}[SUCCESS]${NC} ${message}" >&19
            echo "[$timestamp] SUCCESS: $message"
            ;;
        "WARN")  
            echo -e "${YELLOW}[WARN]${NC} ${message}" >&19
            echo "[$timestamp] WARN: $message"
            ;;
        "ERROR") 
            echo -e "${RED}[ERROR]${NC} ${message}" >&19
            echo "[$timestamp] ERROR: $message"
            ;;
        "STEP") 
            echo -e "${PURPLE}[STEP]${NC} ${BOLD}${message}${NC}" >&19
            echo "[$timestamp] STEP: $message"
            ;;
    esac
}

print_banner() {
    cat << 'EOF' >&19
    
╔══════════════════════════════════════════════════════════════════╗
║                    EVENT MANAGEMENT PORTAL                       ║
║                 Enhanced Deployment Manager v2.0                 ║
╚══════════════════════════════════════════════════════════════════╝

EOF
}

show_deployment_status() {
    local start_time=$1
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))
    
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}" >&19
    echo -e "${CYAN}║                    DEPLOYMENT STATUS                           ║${NC}" >&19
    echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}" >&19
    echo -e "${CYAN}║${NC} Environment: ${GREEN}$ENVIRONMENT${NC}${CYAN}                                  ║${NC}" >&19
    echo -e "${CYAN}║${NC} Deploy Mode: ${GREEN}$DEPLOY_MODE${NC}${CYAN}                                 ║${NC}" >&19
    echo -e "${CYAN}║${NC} Duration: ${GREEN}${elapsed}s${NC}${CYAN}                                      ║${NC}" >&19
    echo -e "${CYAN}║${NC} Status: ${GREEN}IN PROGRESS${NC}${CYAN}                                 ║${NC}" >&19
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}" >&19
}

# =============================================================================
# Configuration and Validation Functions
# =============================================================================

get_env_config() {
    local env=$1
    local key=$2
    echo "${ENV_CONFIGS["${env}:${key}"]:-}"
}

validate_environment() {
    log "STEP" "Validating environment configuration"
    
    if [[ ! " development staging production " =~ " $ENVIRONMENT " ]]; then
        log "ERROR" "Invalid environment: $ENVIRONMENT"
        log "INFO" "Valid environments: development, staging, production"
        return 1
    fi
    
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    if [ ! -f "$PROJECT_ROOT/$compose_file" ]; then
        log "ERROR" "Compose file not found: $compose_file"
        return 1
    fi
    
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [ ! -f "$env_file" ]; then
        log "ERROR" "Environment file not found: $env_file"
        return 1
    fi
    
    log "SUCCESS" "Environment validation passed"
}

check_prerequisites() {
    log "STEP" "Checking deployment prerequisites"
    
    local missing_deps=()
    
    for cmd in docker docker-compose git jq curl pnpm; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log "ERROR" "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        log "ERROR" "Docker daemon not running"
        return 1
    fi
    
    log "SUCCESS" "Prerequisites check passed"
}

# =============================================================================
# Backup and Restore Functions
# =============================================================================

create_deployment_backup() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        log "INFO" "Skipping backup (SKIP_BACKUP=true)"
        return 0
    fi
    
    log "STEP" "Creating deployment backup"
    
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/deployment_${ENVIRONMENT}_${backup_timestamp}"
    
    mkdir -p "$backup_path"
    
    # Backup current configuration
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    cp "$PROJECT_ROOT/$compose_file" "$backup_path/"
    cp "$PROJECT_ROOT/.env.$ENVIRONMENT" "$backup_path/"
    
    # Backup database if running
    if is_service_running "mongodb"; then
        log "INFO" "Creating database backup"
        backup_database "$backup_path"
    fi
    
    # Save current container states
    get_deployment_state > "$backup_path/deployment_state.json"
    
    echo "$backup_path" > "$PROJECT_ROOT/.last_backup"
    log "SUCCESS" "Backup created: $backup_path"
}

backup_database() {
    local backup_path=$1
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    
    # Create MongoDB backup
    docker-compose -f "$compose_file" exec -T mongodb \
        mongodump --gzip --archive="/tmp/db_backup.archive" \
        --db="event_management" || return 1
    
    # Copy backup from container
    docker-compose -f "$compose_file" exec -T mongodb \
        cat /tmp/db_backup.archive > "$backup_path/mongodb_backup.archive"
    
    # Cleanup temporary backup file
    docker-compose -f "$compose_file" exec -T mongodb \
        rm -f /tmp/db_backup.archive
}

get_deployment_state() {
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    
    jq -n \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg environment "$ENVIRONMENT" \
        --argjson containers "$(docker-compose -f "$compose_file" ps --format json 2>/dev/null || echo '[]')" \
        --argjson images "$(docker-compose -f "$compose_file" images --format json 2>/dev/null || echo '[]')" \
        '{
            timestamp: $timestamp,
            environment: $environment,
            containers: $containers,
            images: $images
        }'
}

# =============================================================================
# Service Management Functions
# =============================================================================

is_service_running() {
    local service=$1
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    
    docker-compose -f "$compose_file" ps --services --filter "status=running" 2>/dev/null | \
        grep -q "^${service}$"
}

wait_for_service_health() {
    local service=$1
    local timeout=${2:-120}
    local interval=5
    local count=0
    
    log "INFO" "Waiting for $service to be healthy (timeout: ${timeout}s)"
    
    while [ $count -lt $timeout ]; do
        if check_service_health "$service"; then
            log "SUCCESS" "Service $service is healthy"
            return 0
        fi
        
        sleep $interval
        count=$((count + interval))
        
        if [ $((count % 30)) -eq 0 ]; then
            log "INFO" "Still waiting for $service... (${count}s elapsed)"
        fi
    done
    
    log "ERROR" "Service $service health check timeout"
    return 1
}

check_service_health() {
    local service=$1
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    
    # Check if container is running and healthy
    local status=$(docker-compose -f "$compose_file" ps --format "table {{.Service}}\t{{.Status}}" | \
                  grep "^${service}" | awk '{print $2}')
    
    [[ "$status" =~ ^Up.*healthy$ ]] || [[ "$status" = "Up" ]]
}

# =============================================================================
# Deployment Strategy Functions
# =============================================================================

deploy_standard() {
    log "INFO" "Executing standard deployment"
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    
    # Graceful shutdown
    log "INFO" "Stopping current services"
    docker-compose -f "$compose_file" down --timeout 30
    
    # Pull latest images
    log "INFO" "Pulling latest images"
    docker-compose -f "$compose_file" pull
    
    # Start services
    log "INFO" "Starting services"
    docker-compose -f "$compose_file" up -d --remove-orphans
    
    log "SUCCESS" "Standard deployment completed"
}

deploy_rolling() {
    log "INFO" "Executing rolling deployment"
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    
    # Get services in dependency order
    local services=$(docker-compose -f "$compose_file" config --services)
    
    for service in $services; do
        log "INFO" "Rolling update for service: $service"
        
        docker-compose -f "$compose_file" pull "$service"
        docker-compose -f "$compose_file" up -d --no-deps "$service"
        
        if ! wait_for_service_health "$service" 60; then
            log "ERROR" "Rolling update failed for service: $service"
            return 1
        fi
        
        log "SUCCESS" "Service $service updated successfully"
    done
    
    log "SUCCESS" "Rolling deployment completed"
}

deploy_blue_green() {
    log "INFO" "Executing blue-green deployment"
    log "WARN" "Blue-green deployment is experimental"
    
    # For now, fall back to standard deployment
    # TODO: Implement proper blue-green deployment with load balancer integration
    deploy_standard
}

# =============================================================================
# Testing and Health Check Functions
# =============================================================================

run_pre_deployment_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log "INFO" "Skipping tests (SKIP_TESTS=true)"
        return 0
    fi
    
    log "STEP" "Running pre-deployment tests"
    
    cd "$PROJECT_ROOT"
    
    # Type checking
    if ! pnpm type-check; then
        log "ERROR" "Type checking failed"
        return 1
    fi
    
    # Linting
    if ! pnpm lint:check; then
        log "ERROR" "Linting failed"
        return 1
    fi
    
    # Unit tests
    if ! pnpm test:unit; then
        log "ERROR" "Unit tests failed"
        return 1
    fi
    
    log "SUCCESS" "Pre-deployment tests passed"
}

run_deployment_health_checks() {
    if [ "$SKIP_HEALTH_CHECK" = "true" ]; then
        log "INFO" "Skipping health checks (SKIP_HEALTH_CHECK=true)"
        return 0
    fi
    
    log "STEP" "Running deployment health checks"
    
    local health_url=$(get_env_config "$ENVIRONMENT" "health_url")
    local api_health_url="${health_url%/health}/api/v1/health"
    
    # Application health check
    if ! curl -sf "$health_url" -o /dev/null; then
        log "ERROR" "Application health check failed"
        return 1
    fi
    
    # API health check  
    if ! curl -sf "$api_health_url" -o /dev/null; then
        log "ERROR" "API health check failed"
        return 1
    fi
    
    # Database connectivity
    if ! test_database_connectivity; then
        log "ERROR" "Database connectivity check failed"
        return 1
    fi
    
    log "SUCCESS" "All health checks passed"
}

test_database_connectivity() {
    local health_url=$(get_env_config "$ENVIRONMENT" "health_url")
    local api_url="${health_url%/health}/api/v1"
    
    # Test API endpoint that requires database
    curl -sf "$api_url/events?limit=1" -o /dev/null
}

# =============================================================================
# Rollback Functions
# =============================================================================

rollback_deployment() {
    if [ ! -f "$PROJECT_ROOT/.last_backup" ]; then
        log "ERROR" "No backup available for rollback"
        return 1
    fi
    
    local backup_path=$(cat "$PROJECT_ROOT/.last_backup")
    
    if [ ! -d "$backup_path" ]; then
        log "ERROR" "Backup directory not found: $backup_path"
        return 1
    fi
    
    log "WARN" "Rolling back deployment"
    
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    
    # Stop current services
    docker-compose -f "$compose_file" down --timeout 30
    
    # Restore configuration
    cp "$backup_path/$(basename "$compose_file")" "$PROJECT_ROOT/"
    cp "$backup_path/.env.$ENVIRONMENT" "$PROJECT_ROOT/"
    
    # Restore database if backup exists
    if [ -f "$backup_path/mongodb_backup.archive" ]; then
        log "INFO" "Restoring database backup"
        restore_database_backup "$backup_path/mongodb_backup.archive"
    fi
    
    # Start services
    docker-compose -f "$compose_file" up -d
    
    if run_deployment_health_checks; then
        log "SUCCESS" "Rollback completed successfully"
        return 0
    else
        log "ERROR" "Rollback health check failed"
        return 1
    fi
}

restore_database_backup() {
    local backup_file=$1
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    
    # Wait for MongoDB to be ready
    wait_for_service_health "mongodb" 60
    
    # Restore from backup
    cat "$backup_file" | docker-compose -f "$compose_file" exec -T mongodb \
        mongorestore --gzip --archive --drop --db="event_management"
}

# =============================================================================
# Notification and Reporting Functions
# =============================================================================

send_deployment_notification() {
    local status=$1
    local message=$2
    local duration=${3:-"N/A"}
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        send_slack_notification "$status" "$message" "$duration"
    fi
    
    # Discord notification
    if [ -n "${DISCORD_WEBHOOK_URL:-}" ]; then
        send_discord_notification "$status" "$message" "$duration"
    fi
    
    # Email notification
    if [ -n "${EMAIL_NOTIFICATION:-}" ]; then
        send_email_notification "$status" "$message" "$duration"
    fi
}

send_slack_notification() {
    local status=$1
    local message=$2
    local duration=$3
    
    local color="good"
    local emoji="✅"
    
    case $status in
        "failed"|"error") color="danger"; emoji="❌" ;;
        "warning"|"rollback") color="warning"; emoji="⚠️" ;;
        "success") color="good"; emoji="✅" ;;
    esac
    
    local payload=$(jq -n \
        --arg text "$emoji Deployment $status" \
        --arg color "$color" \
        --arg message "$message" \
        --arg environment "$ENVIRONMENT" \
        --arg mode "$DEPLOY_MODE" \
        --arg duration "$duration" \
        '{
            attachments: [{
                color: $color,
                title: $text,
                text: $message,
                fields: [
                    { title: "Environment", value: $environment, short: true },
                    { title: "Mode", value: $mode, short: true },
                    { title: "Duration", value: $duration, short: true },
                    { title: "Timestamp", value: now | strftime("%Y-%m-%d %H:%M:%S UTC"), short: true }
                ],
                footer: "Event Management Portal Deployment",
                ts: now
            }]
        }'
    )
    
    curl -s -X POST -H 'Content-type: application/json' \
         --data "$payload" \
         "$SLACK_WEBHOOK_URL" > /dev/null || true
}

generate_deployment_report() {
    local start_time=$1
    local end_time=$2
    local status=$3
    
    local duration=$((end_time - start_time))
    local report_file="$DEPLOY_LOG_DIR/deployment-report-$(date '+%Y%m%d_%H%M%S').json"
    
    jq -n \
        --arg start_time "$(date -d "@$start_time" -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg end_time "$(date -d "@$end_time" -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg duration "$duration" \
        --arg environment "$ENVIRONMENT" \
        --arg deploy_mode "$DEPLOY_MODE" \
        --arg status "$status" \
        --argjson deployment_state "$(get_deployment_state)" \
        '{
            deployment: {
                start_time: $start_time,
                end_time: $end_time,
                duration_seconds: ($duration | tonumber),
                environment: $environment,
                deploy_mode: $deploy_mode,
                status: $status
            },
            state: $deployment_state
        }' > "$report_file"
    
    log "INFO" "Deployment report saved: $report_file"
}

# =============================================================================
# Main Deployment Orchestration
# =============================================================================

show_help() {
    cat << EOF >&19
Enhanced Deployment Manager v$SCRIPT_VERSION
Event Management Portal

USAGE:
    $0 [ENVIRONMENT] [DEPLOY_MODE] [OPTIONS]

ENVIRONMENTS:
    development  - Local development environment
    staging      - Staging environment 
    production   - Production environment

DEPLOY_MODES:
    standard     - Standard deployment (stop -> start)
    rolling      - Rolling update (zero downtime)
    blue-green   - Blue-green deployment (experimental)

OPTIONS:
    --force              Force deployment without confirmation
    --skip-backup        Skip creating backup
    --skip-tests         Skip running tests
    --skip-health-check  Skip health checks
    --dry-run           Show what would be done without executing
    --no-rollback       Don't rollback on failure
    --help              Show this help

ENVIRONMENT VARIABLES:
    FORCE_DEPLOY        Force deployment (true/false)
    SKIP_BACKUP         Skip backup creation (true/false)
    SKIP_TESTS          Skip tests (true/false)
    SKIP_HEALTH_CHECK   Skip health checks (true/false)
    DRY_RUN            Dry run mode (true/false)
    ROLLBACK_ON_FAILURE Enable rollback on failure (true/false)
    SLACK_WEBHOOK_URL   Slack webhook for notifications

EXAMPLES:
    $0 staging
    $0 production rolling --skip-tests
    $0 development --dry-run
    FORCE_DEPLOY=true $0 production

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force) FORCE_DEPLOY=true; shift ;;
            --skip-backup) SKIP_BACKUP=true; shift ;;
            --skip-tests) SKIP_TESTS=true; shift ;;
            --skip-health-check) SKIP_HEALTH_CHECK=true; shift ;;
            --dry-run) DRY_RUN=true; shift ;;
            --no-rollback) ROLLBACK_ON_FAILURE=false; shift ;;
            --help|-h) show_help; exit 0 ;;
            -*) log "ERROR" "Unknown option: $1"; exit 1 ;;
            *) break ;;
        esac
    done
}

confirm_deployment() {
    if [ "$FORCE_DEPLOY" = "true" ] || [ "$DRY_RUN" = "true" ]; then
        return 0
    fi
    
    echo >&19
    echo -e "${YELLOW}⚠️  You are about to deploy to ${BOLD}$ENVIRONMENT${NC}${YELLOW} environment${NC}" >&19
    echo -e "${YELLOW}   Deploy mode: ${BOLD}$DEPLOY_MODE${NC}" >&19
    echo >&19
    read -p "Are you sure you want to continue? [y/N]: " -n 1 -r >&19
    echo >&19
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Deployment cancelled by user"
        exit 0
    fi
}

execute_deployment() {
    local start_time=$(date +%s)
    
    # Show deployment progress
    show_deployment_status "$start_time"
    
    # Execute deployment steps
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN - Would execute deployment steps"
        return 0
    fi
    
    # Main deployment pipeline
    create_deployment_backup
    run_pre_deployment_tests
    
    case $DEPLOY_MODE in
        "rolling") deploy_rolling ;;
        "blue-green") deploy_blue_green ;;
        *) deploy_standard ;;
    esac
    
    run_deployment_health_checks
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    generate_deployment_report "$start_time" "$end_time" "success"
    send_deployment_notification "success" "Deployment completed successfully" "${duration}s"
    
    log "SUCCESS" "Deployment completed in ${duration}s"
}

main() {
    local start_time=$(date +%s)
    
    # Setup
    setup_logging
    print_banner
    
    # Parse arguments
    parse_arguments "$@"
    
    log "INFO" "Starting deployment manager v$SCRIPT_VERSION"
    log "INFO" "Environment: $ENVIRONMENT | Mode: $DEPLOY_MODE"
    
    # Validation
    if ! validate_environment; then
        exit 1
    fi
    
    if ! check_prerequisites; then
        exit 1
    fi
    
    # Confirmation
    confirm_deployment
    
    # Execute deployment with error handling
    if execute_deployment; then
        exit 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            log "WARN" "Deployment failed, attempting rollback"
            if rollback_deployment; then
                generate_deployment_report "$start_time" "$end_time" "rollback"
                send_deployment_notification "rollback" "Deployment failed but rollback successful" "${duration}s"
                exit 2
            else
                generate_deployment_report "$start_time" "$end_time" "failed"
                send_deployment_notification "failed" "Deployment and rollback both failed" "${duration}s"
                exit 1
            fi
        else
            generate_deployment_report "$start_time" "$end_time" "failed"
            send_deployment_notification "failed" "Deployment failed" "${duration}s"
            exit 1
        fi
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi