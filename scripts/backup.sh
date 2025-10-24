#!/bin/bash

# =============================================================================
# Automated Backup Script
# Event Management Portal - Database and application backup automation
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
ENVIRONMENT="${1:-production}"
BACKUP_TYPE="${2:-full}"
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-$PROJECT_ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPRESS_BACKUPS="${COMPRESS_BACKUPS:-true}"
ENCRYPT_BACKUPS="${ENCRYPT_BACKUPS:-false}"
UPLOAD_TO_S3="${UPLOAD_TO_S3:-false}"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Backup metadata
BACKUP_TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="$BACKUP_BASE_DIR/$ENVIRONMENT/$BACKUP_TIMESTAMP"
BACKUP_LOG="$BACKUP_DIR/backup.log"

# Environment configurations
declare -A ENV_CONFIGS
ENV_CONFIGS=(
    ["development:compose_file"]="docker-compose.yml"
    ["development:mongodb_container"]="mongodb"
    ["development:redis_container"]="redis"
    
    ["staging:compose_file"]="docker-compose.staging.yml"
    ["staging:mongodb_container"]="staging-mongodb"
    ["staging:redis_container"]="staging-redis"
    
    ["production:compose_file"]="docker-compose.prod.yml"
    ["production:mongodb_container"]="prod-mongodb"
    ["production:redis_container"]="prod-redis"
)

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
    
    # Also log to backup log file
    if [ -n "${BACKUP_LOG:-}" ]; then
        echo "[$timestamp] $level: $message" >> "$BACKUP_LOG" 2>/dev/null || true
    fi
}

get_env_config() {
    local env=$1
    local key=$2
    echo "${ENV_CONFIGS["${env}:${key}"]:-}"
}

check_prerequisites() {
    log "INFO" "Checking backup prerequisites..."
    
    local missing_deps=()
    
    # Check required commands
    for cmd in docker docker-compose mongodump redis-cli tar gzip; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check optional commands
    if [ "$ENCRYPT_BACKUPS" = "true" ] && ! command -v gpg &> /dev/null; then
        missing_deps+=("gpg")
    fi
    
    if [ "$UPLOAD_TO_S3" = "true" ] && ! command -v aws &> /dev/null; then
        missing_deps+=("aws")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log "ERROR" "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log "ERROR" "Docker daemon not running"
        return 1
    fi
    
    # Validate environment
    if [[ ! " development staging production " =~ " $ENVIRONMENT " ]]; then
        log "ERROR" "Invalid environment: $ENVIRONMENT"
        return 1
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    log "SUCCESS" "Prerequisites check passed"
    return 0
}

# =============================================================================
# Backup Functions
# =============================================================================

backup_mongodb() {
    log "INFO" "Starting MongoDB backup..."
    
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    local mongodb_container=$(get_env_config "$ENVIRONMENT" "mongodb_container")
    
    # Check if MongoDB container is running
    if ! docker-compose -f "$compose_file" ps | grep -q "$mongodb_container.*Up"; then
        log "ERROR" "MongoDB container not running"
        return 1
    fi
    
    local mongodb_backup_dir="$BACKUP_DIR/mongodb"
    mkdir -p "$mongodb_backup_dir"
    
    # Get database configuration from environment
    source "$PROJECT_ROOT/.env.$ENVIRONMENT" 2>/dev/null || true
    
    local db_name="${MONGODB_DATABASE:-event_management}"
    local backup_file="$mongodb_backup_dir/mongodb_${BACKUP_TIMESTAMP}.archive"
    
    # Create MongoDB backup
    log "INFO" "Creating MongoDB dump for database: $db_name"
    
    if docker-compose -f "$compose_file" exec -T "$mongodb_container" \
       mongodump --db "$db_name" --gzip --archive="/tmp/backup.archive"; then
        
        # Copy backup from container
        docker-compose -f "$compose_file" exec -T "$mongodb_container" \
            cat /tmp/backup.archive > "$backup_file"
        
        # Cleanup temporary file
        docker-compose -f "$compose_file" exec -T "$mongodb_container" \
            rm -f /tmp/backup.archive
        
        # Verify backup file
        if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
            local backup_size=$(du -h "$backup_file" | cut -f1)
            log "SUCCESS" "MongoDB backup completed ($backup_size)"
            
            # Create backup metadata
            cat > "$mongodb_backup_dir/metadata.json" << EOF
{
    "timestamp": "$BACKUP_TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "database": "$db_name",
    "backup_file": "$(basename "$backup_file")",
    "backup_size": "$backup_size",
    "backup_type": "mongodump",
    "compressed": true
}
EOF
            return 0
        else
            log "ERROR" "MongoDB backup file is empty or missing"
            return 1
        fi
    else
        log "ERROR" "MongoDB backup failed"
        return 1
    fi
}

backup_redis() {
    log "INFO" "Starting Redis backup..."
    
    local compose_file=$(get_env_config "$ENVIRONMENT" "compose_file")
    local redis_container=$(get_env_config "$ENVIRONMENT" "redis_container")
    
    # Check if Redis container is running
    if ! docker-compose -f "$compose_file" ps | grep -q "$redis_container.*Up"; then
        log "WARN" "Redis container not running, skipping backup"
        return 0
    fi
    
    local redis_backup_dir="$BACKUP_DIR/redis"
    mkdir -p "$redis_backup_dir"
    
    local backup_file="$redis_backup_dir/redis_${BACKUP_TIMESTAMP}.rdb"
    
    # Create Redis backup using BGSAVE
    log "INFO" "Creating Redis backup..."
    
    if docker-compose -f "$compose_file" exec -T "$redis_container" redis-cli BGSAVE; then
        # Wait for background save to complete
        while docker-compose -f "$compose_file" exec -T "$redis_container" redis-cli LASTSAVE | grep -q "$(docker-compose -f "$compose_file" exec -T "$redis_container" redis-cli LASTSAVE)"; do
            sleep 1
        done
        
        # Copy RDB file from container
        docker-compose -f "$compose_file" exec -T "$redis_container" \
            cat /data/dump.rdb > "$backup_file" 2>/dev/null || {
                log "WARN" "Could not copy Redis RDB file, trying alternative method"
                docker cp "${redis_container}:/data/dump.rdb" "$backup_file" 2>/dev/null || {
                    log "ERROR" "Failed to backup Redis data"
                    return 1
                }
            }
        
        if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
            local backup_size=$(du -h "$backup_file" | cut -f1)
            log "SUCCESS" "Redis backup completed ($backup_size)"
            
            # Create backup metadata
            cat > "$redis_backup_dir/metadata.json" << EOF
{
    "timestamp": "$BACKUP_TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "backup_file": "$(basename "$backup_file")",
    "backup_size": "$backup_size",
    "backup_type": "rdb",
    "compressed": false
}
EOF
            return 0
        else
            log "ERROR" "Redis backup file is empty or missing"
            return 1
        fi
    else
        log "ERROR" "Redis BGSAVE failed"
        return 1
    fi
}

backup_application_files() {
    log "INFO" "Starting application files backup..."
    
    local app_backup_dir="$BACKUP_DIR/application"
    mkdir -p "$app_backup_dir"
    
    # Backup configuration files
    local config_backup="$app_backup_dir/config_${BACKUP_TIMESTAMP}.tar.gz"
    
    log "INFO" "Backing up configuration files..."
    tar -czf "$config_backup" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude="dist" \
        --exclude="build" \
        --exclude="coverage" \
        --exclude="logs" \
        -C "$PROJECT_ROOT" \
        .env.* \
        docker-compose*.yml \
        package.json \
        pnpm-lock.yaml \
        configs/ \
        scripts/ \
        2>/dev/null || true
    
    # Backup uploaded files (if they exist locally)
    local uploads_dir="$PROJECT_ROOT/uploads"
    if [ -d "$uploads_dir" ]; then
        local uploads_backup="$app_backup_dir/uploads_${BACKUP_TIMESTAMP}.tar.gz"
        log "INFO" "Backing up uploaded files..."
        tar -czf "$uploads_backup" -C "$PROJECT_ROOT" uploads/ 2>/dev/null || true
    fi
    
    # Backup logs
    local logs_dir="$PROJECT_ROOT/logs"
    if [ -d "$logs_dir" ]; then
        local logs_backup="$app_backup_dir/logs_${BACKUP_TIMESTAMP}.tar.gz"
        log "INFO" "Backing up application logs..."
        tar -czf "$logs_backup" -C "$PROJECT_ROOT" logs/ 2>/dev/null || true
    fi
    
    # Create application backup metadata
    cat > "$app_backup_dir/metadata.json" << EOF
{
    "timestamp": "$BACKUP_TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "config_backup": "$(basename "$config_backup")",
    "includes": ["configuration", "scripts", "package files"],
    "backup_type": "tar.gz"
}
EOF
    
    log "SUCCESS" "Application files backup completed"
}

backup_ssl_certificates() {
    if [ "$ENVIRONMENT" = "development" ]; then
        log "INFO" "Skipping SSL certificates backup for development"
        return 0
    fi
    
    log "INFO" "Starting SSL certificates backup..."
    
    local ssl_backup_dir="$BACKUP_DIR/ssl"
    mkdir -p "$ssl_backup_dir"
    
    # Check for Let's Encrypt certificates
    local letsencrypt_dir="/etc/letsencrypt"
    local ssl_backup="$ssl_backup_dir/ssl_certificates_${BACKUP_TIMESTAMP}.tar.gz"
    
    if [ -d "$letsencrypt_dir" ]; then
        log "INFO" "Backing up Let's Encrypt certificates..."
        sudo tar -czf "$ssl_backup" -C / etc/letsencrypt/ 2>/dev/null || {
            log "WARN" "Could not backup SSL certificates (insufficient permissions)"
            return 0
        }
        
        # Create SSL backup metadata
        cat > "$ssl_backup_dir/metadata.json" << EOF
{
    "timestamp": "$BACKUP_TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "ssl_backup": "$(basename "$ssl_backup")",
    "source": "$letsencrypt_dir",
    "backup_type": "tar.gz"
}
EOF
        
        log "SUCCESS" "SSL certificates backup completed"
    else
        log "INFO" "No SSL certificates found to backup"
    fi
}

# =============================================================================
# Backup Processing Functions
# =============================================================================

compress_backups() {
    if [ "$COMPRESS_BACKUPS" != "true" ]; then
        return 0
    fi
    
    log "INFO" "Compressing backup archives..."
    
    # Find all uncompressed backup files
    find "$BACKUP_DIR" -type f \( -name "*.archive" -o -name "*.rdb" \) | while read -r file; do
        if [ -f "$file" ]; then
            log "INFO" "Compressing $(basename "$file")..."
            gzip "$file" && log "SUCCESS" "Compressed $(basename "$file").gz"
        fi
    done
}

encrypt_backups() {
    if [ "$ENCRYPT_BACKUPS" != "true" ]; then
        return 0
    fi
    
    if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
        log "ERROR" "BACKUP_ENCRYPTION_KEY not set for encryption"
        return 1
    fi
    
    log "INFO" "Encrypting backup files..."
    
    # Find all backup files to encrypt
    find "$BACKUP_DIR" -type f \( -name "*.gz" -o -name "*.tar" -o -name "*.archive*" -o -name "*.rdb*" \) | while read -r file; do
        if [ -f "$file" ]; then
            log "INFO" "Encrypting $(basename "$file")..."
            gpg --symmetric --cipher-algo AES256 --passphrase "$BACKUP_ENCRYPTION_KEY" --batch --yes "$file"
            
            if [ -f "${file}.gpg" ]; then
                rm "$file"
                log "SUCCESS" "Encrypted $(basename "$file")"
            else
                log "ERROR" "Failed to encrypt $(basename "$file")"
            fi
        fi
    done
}

create_backup_manifest() {
    log "INFO" "Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/manifest.json"
    local backup_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    local file_count=$(find "$BACKUP_DIR" -type f | wc -l)
    
    # Generate file checksums
    local checksums_file="$BACKUP_DIR/checksums.sha256"
    find "$BACKUP_DIR" -type f -not -name "manifest.json" -not -name "checksums.sha256" -exec sha256sum {} \; > "$checksums_file"
    
    # Create manifest
    cat > "$manifest_file" << EOF
{
    "backup_info": {
        "timestamp": "$BACKUP_TIMESTAMP",
        "environment": "$ENVIRONMENT",
        "backup_type": "$BACKUP_TYPE",
        "total_size": "$backup_size",
        "file_count": $file_count,
        "compressed": $COMPRESS_BACKUPS,
        "encrypted": $ENCRYPT_BACKUPS
    },
    "components": {
        "mongodb": $([ -d "$BACKUP_DIR/mongodb" ] && echo "true" || echo "false"),
        "redis": $([ -d "$BACKUP_DIR/redis" ] && echo "true" || echo "false"),
        "application": $([ -d "$BACKUP_DIR/application" ] && echo "true" || echo "false"),
        "ssl": $([ -d "$BACKUP_DIR/ssl" ] && echo "true" || echo "false")
    },
    "created_by": "$(whoami)@$(hostname)",
    "script_version": "2.0.0"
}
EOF
    
    log "SUCCESS" "Backup manifest created"
}

# =============================================================================
# Upload and Cleanup Functions
# =============================================================================

upload_to_s3() {
    if [ "$UPLOAD_TO_S3" != "true" ]; then
        return 0
    fi
    
    if [ -z "${S3_BUCKET:-}" ]; then
        log "ERROR" "S3_BUCKET not configured for upload"
        return 1
    fi
    
    log "INFO" "Uploading backup to S3..."
    
    local s3_path="s3://$S3_BUCKET/$ENVIRONMENT/backups/$BACKUP_TIMESTAMP/"
    
    if aws s3 sync "$BACKUP_DIR" "$s3_path" --storage-class STANDARD_IA; then
        log "SUCCESS" "Backup uploaded to S3: $s3_path"
        
        # Update manifest with S3 location
        local manifest_file="$BACKUP_DIR/manifest.json"
        if [ -f "$manifest_file" ]; then
            jq --arg s3_path "$s3_path" '.backup_info.s3_location = $s3_path' "$manifest_file" > "${manifest_file}.tmp"
            mv "${manifest_file}.tmp" "$manifest_file"
        fi
        
        return 0
    else
        log "ERROR" "Failed to upload backup to S3"
        return 1
    fi
}

cleanup_old_backups() {
    log "INFO" "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
    
    local env_backup_dir="$BACKUP_BASE_DIR/$ENVIRONMENT"
    
    if [ ! -d "$env_backup_dir" ]; then
        log "INFO" "No backup directory found for cleanup"
        return 0
    fi
    
    # Find and remove old backup directories
    find "$env_backup_dir" -maxdepth 1 -type d -name "20*" -mtime +$RETENTION_DAYS | while read -r old_backup; do
        if [ -d "$old_backup" ]; then
            log "INFO" "Removing old backup: $(basename "$old_backup")"
            rm -rf "$old_backup"
        fi
    done
    
    # Clean up old S3 backups if configured
    if [ "$UPLOAD_TO_S3" = "true" ] && [ -n "${S3_BUCKET:-}" ]; then
        log "INFO" "Cleaning up old S3 backups..."
        
        local cutoff_date=$(date -d "-${RETENTION_DAYS} days" '+%Y%m%d')
        
        aws s3 ls "s3://$S3_BUCKET/$ENVIRONMENT/backups/" | while read -r line; do
            local backup_date=$(echo "$line" | grep -o '20[0-9][0-9][0-9][0-9][0-9][0-9]_[0-9][0-9][0-9][0-9][0-9][0-9]' | cut -d_ -f1)
            
            if [ -n "$backup_date" ] && [ "$backup_date" -lt "$cutoff_date" ]; then
                local old_s3_backup="s3://$S3_BUCKET/$ENVIRONMENT/backups/${backup_date}_*/"
                log "INFO" "Removing old S3 backup: $old_s3_backup"
                aws s3 rm "$old_s3_backup" --recursive 2>/dev/null || true
            fi
        done
    fi
    
    log "SUCCESS" "Old backups cleanup completed"
}

# =============================================================================
# Notification Functions
# =============================================================================

send_backup_notification() {
    local status=$1
    local message=$2
    local backup_size=${3:-"N/A"}
    
    # Send Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        send_slack_backup_notification "$status" "$message" "$backup_size"
    fi
    
    # Send email notification
    if [ -n "${BACKUP_EMAIL_TO:-}" ]; then
        send_email_backup_notification "$status" "$message" "$backup_size"
    fi
}

send_slack_backup_notification() {
    local status=$1
    local message=$2
    local backup_size=$3
    
    local color="good"
    local emoji="✅"
    
    case $status in
        "failed"|"error") color="danger"; emoji="❌" ;;
        "warning") color="warning"; emoji="⚠️" ;;
        "success") color="good"; emoji="✅" ;;
    esac
    
    local payload=$(jq -n \
        --arg text "$emoji Backup $status - $ENVIRONMENT" \
        --arg color "$color" \
        --arg message "$message" \
        --arg environment "$ENVIRONMENT" \
        --arg backup_type "$BACKUP_TYPE" \
        --arg backup_size "$backup_size" \
        --arg timestamp "$BACKUP_TIMESTAMP" \
        '{
            attachments: [{
                color: $color,
                title: $text,
                text: $message,
                fields: [
                    { title: "Environment", value: $environment, short: true },
                    { title: "Backup Type", value: $backup_type, short: true },
                    { title: "Backup Size", value: $backup_size, short: true },
                    { title: "Timestamp", value: $timestamp, short: true }
                ],
                footer: "Event Management Portal Backup System"
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

run_quick_backup() {
    log "INFO" "Running quick backup (database only)..."
    
    backup_mongodb || return 1
    create_backup_manifest
    
    log "SUCCESS" "Quick backup completed"
}

run_full_backup() {
    log "INFO" "Running full backup (all components)..."
    
    local failed_components=()
    
    # Backup all components
    backup_mongodb || failed_components+=("mongodb")
    backup_redis || failed_components+=("redis")
    backup_application_files || failed_components+=("application")
    backup_ssl_certificates || failed_components+=("ssl")
    
    # Process backups
    compress_backups
    encrypt_backups
    create_backup_manifest
    
    # Upload if configured
    upload_to_s3 || log "WARN" "S3 upload failed or not configured"
    
    if [ ${#failed_components[@]} -eq 0 ]; then
        log "SUCCESS" "Full backup completed successfully"
        return 0
    else
        log "WARN" "Backup completed with failures: ${failed_components[*]}"
        return 1
    fi
}

show_help() {
    cat << EOF
Automated Backup Script
Event Management Portal

USAGE:
    $0 [ENVIRONMENT] [BACKUP_TYPE] [OPTIONS]

ENVIRONMENTS:
    development  - Local development environment
    staging      - Staging environment
    production   - Production environment

BACKUP_TYPES:
    quick        - Database backup only
    full         - Complete backup (database, files, SSL certificates)

ENVIRONMENT VARIABLES:
    BACKUP_BASE_DIR        Base directory for backups (default: ./backups)
    RETENTION_DAYS         Days to keep backups (default: 30)
    COMPRESS_BACKUPS       Compress backup files (true/false, default: true)
    ENCRYPT_BACKUPS        Encrypt backup files (true/false, default: false)
    BACKUP_ENCRYPTION_KEY  Encryption key for backups (required if encrypting)
    UPLOAD_TO_S3          Upload backups to S3 (true/false, default: false)
    S3_BUCKET             S3 bucket for backup storage
    SLACK_WEBHOOK_URL     Slack webhook for notifications
    BACKUP_EMAIL_TO       Email address for notifications

EXAMPLES:
    $0 production full
    $0 staging quick
    RETENTION_DAYS=7 $0 development full
    ENCRYPT_BACKUPS=true $0 production full

EOF
}

main() {
    # Parse arguments
    if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
        show_help
        exit 0
    fi
    
    local start_time=$(date +%s)
    
    log "INFO" "Starting backup process for $ENVIRONMENT environment"
    log "INFO" "Backup type: $BACKUP_TYPE"
    log "INFO" "Backup directory: $BACKUP_DIR"
    
    # Check prerequisites
    if ! check_prerequisites; then
        log "ERROR" "Prerequisites check failed"
        exit 1
    fi
    
    # Run backup based on type
    if case $BACKUP_TYPE in
        "quick") run_quick_backup ;;
        "full"|*) run_full_backup ;;
    esac; then
        # Cleanup old backups
        cleanup_old_backups
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local backup_size=$(du -sh "$BACKUP_DIR" | cut -f1)
        
        local success_msg="Backup completed successfully in ${duration}s (Size: $backup_size)"
        log "SUCCESS" "$success_msg"
        send_backup_notification "success" "$success_msg" "$backup_size"
        
        exit 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        local fail_msg="Backup failed after ${duration}s"
        log "ERROR" "$fail_msg"
        send_backup_notification "failed" "$fail_msg"
        
        exit 1
    fi
}

# Run main function
main "$@"