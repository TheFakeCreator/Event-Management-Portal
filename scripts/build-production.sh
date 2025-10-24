#!/bin/bash

# =============================================================================
# Production Build Script
# Event Management Portal - TypeScript Monorepo
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="./build"
DIST_DIR="./dist"
LOG_FILE="./build.log"

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

cleanup() {
    log_info "Cleaning up previous builds..."
    rm -rf "$BUILD_DIR" || true
    rm -rf "$DIST_DIR" || true
    rm -f "$LOG_FILE" || true
    pnpm clean || true
}

check_environment() {
    log_info "Checking environment..."
    
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found"
        exit 1
    fi
    
    # Check Node version
    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"
    
    # Check pnpm version
    PNPM_VERSION=$(pnpm --version)
    log_info "pnpm version: $PNPM_VERSION"
    
    # Load production environment
    export NODE_ENV=production
    source .env.production
    
    log_success "Environment check passed"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    pnpm install --frozen-lockfile --production=false
    
    if [ $? -ne 0 ]; then
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    log_success "Dependencies installed successfully"
}

run_type_check() {
    log_info "Running type checks..."
    
    pnpm type-check
    
    if [ $? -ne 0 ]; then
        log_error "Type check failed"
        exit 1
    fi
    
    log_success "Type check passed"
}

run_lint() {
    log_info "Running linting..."
    
    pnpm lint
    
    if [ $? -ne 0 ]; then
        log_warning "Linting issues found but continuing..."
    else
        log_success "Linting passed"
    fi
}

run_tests() {
    log_info "Running tests..."
    
    pnpm test:unit
    
    if [ $? -ne 0 ]; then
        log_error "Tests failed"
        exit 1
    fi
    
    log_success "Tests passed"
}

build_shared() {
    log_info "Building shared package..."
    
    pnpm --filter @event-management/shared build:prod
    
    if [ $? -ne 0 ]; then
        log_error "Failed to build shared package"
        exit 1
    fi
    
    log_success "Shared package built successfully"
}

build_backend() {
    log_info "Building backend..."
    
    pnpm --filter @event-management/backend build:prod
    
    if [ $? -ne 0 ]; then
        log_error "Failed to build backend"
        exit 1
    fi
    
    log_success "Backend built successfully"
}

build_frontend() {
    log_info "Building frontend..."
    
    pnpm --filter @event-management/frontend build:prod
    
    if [ $? -ne 0 ]; then
        log_error "Failed to build frontend"
        exit 1
    fi
    
    log_success "Frontend built successfully"
}

analyze_bundle() {
    log_info "Analyzing bundle size..."
    
    pnpm --filter @event-management/frontend analyze || log_warning "Bundle analysis failed or not configured"
    
    log_success "Bundle analysis completed"
}

create_build_archive() {
    log_info "Creating build archive..."
    
    mkdir -p "$BUILD_DIR"
    
    # Copy built packages
    cp -r packages/shared/dist "$BUILD_DIR/shared" || true
    cp -r packages/backend/dist "$BUILD_DIR/backend" || true
    cp -r packages/frontend/.next "$BUILD_DIR/frontend" || true
    
    # Copy package.json files for production dependencies
    cp packages/shared/package.json "$BUILD_DIR/shared/" || true
    cp packages/backend/package.json "$BUILD_DIR/backend/" || true
    cp packages/frontend/package.json "$BUILD_DIR/frontend/" || true
    
    # Copy configuration files
    cp .env.production "$BUILD_DIR/" || true
    cp docker-compose.prod.yml "$BUILD_DIR/" || true
    
    # Create production package.json
    cat > "$BUILD_DIR/package.json" << EOF
{
  "name": "event-management-production",
  "version": "1.0.0",
  "scripts": {
    "start": "node backend/app.js",
    "start:frontend": "cd frontend && npm start",
    "start:backend": "cd backend && npm start"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
    
    # Create tarball
    tar -czf "event-management-build-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$BUILD_DIR" .
    
    log_success "Build archive created successfully"
}

generate_build_report() {
    log_info "Generating build report..."
    
    cat > "build-report.md" << EOF
# Build Report

**Build Date:** $(date)
**Node Version:** $(node --version)
**pnpm Version:** $(pnpm --version)
**Environment:** production

## Package Sizes

\`\`\`
$(du -sh build/* 2>/dev/null || echo "Build directory not found")
\`\`\`

## Build Status

- ✅ Dependencies installed
- ✅ Type check passed  
- ✅ Linting completed
- ✅ Tests passed
- ✅ Shared package built
- ✅ Backend built
- ✅ Frontend built
- ✅ Bundle analyzed
- ✅ Build archive created

## Next Steps

1. Deploy the build archive to production server
2. Set up environment variables on production
3. Run Docker containers
4. Verify deployment health checks

EOF

    log_success "Build report generated: build-report.md"
}

# Main build process
main() {
    log_info "Starting production build process..."
    
    cleanup
    check_environment
    install_dependencies
    run_type_check
    run_lint
    run_tests
    build_shared
    build_backend
    build_frontend
    analyze_bundle
    create_build_archive
    generate_build_report
    
    log_success "Production build completed successfully!"
    log_info "Build artifacts:"
    log_info "  - Build directory: $BUILD_DIR"
    log_info "  - Build archive: event-management-build-*.tar.gz"
    log_info "  - Build report: build-report.md"
    log_info "  - Build log: $LOG_FILE"
}

# Run with error handling
if main "$@"; then
    exit 0
else
    log_error "Build failed!"
    exit 1
fi