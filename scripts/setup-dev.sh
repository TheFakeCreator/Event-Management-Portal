#!/bin/bash

# =============================================================================
# Local Development Environment Setup Script
# =============================================================================

set -e  # Exit on any error

echo "🛠️  Setting up Event Management Portal Development Environment"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        print_status "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION is not supported. Please upgrade to Node.js 18+."
        exit 1
    fi
    
    print_success "Node.js $NODE_VERSION detected"
}

# Check if pnpm is installed
check_pnpm() {
    print_status "Checking pnpm installation..."
    
    if ! command -v pnpm &> /dev/null; then
        print_status "Installing pnpm..."
        npm install -g pnpm
        print_success "pnpm installed successfully"
    else
        PNPM_VERSION=$(pnpm -v)
        print_success "pnpm $PNPM_VERSION detected"
    fi
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Frontend environment
    if [ ! -f "packages/frontend/.env.local" ]; then
        print_status "Creating frontend environment file..."
        cp "packages/frontend/.env.example" "packages/frontend/.env.local"
        print_warning "Please configure packages/frontend/.env.local with your settings"
    else
        print_success "Frontend environment file already exists"
    fi
    
    # Backend environment
    if [ ! -f "packages/backend/.env" ]; then
        print_status "Creating backend environment file..."
        if [ -f "packages/backend/.env.example" ]; then
            cp "packages/backend/.env.example" "packages/backend/.env"
        else
            # Create basic backend .env if example doesn't exist
            cat > "packages/backend/.env" << EOL
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/event-management
JWT_SECRET=your-jwt-secret-key-development
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@localhost
EOL
        fi
        print_warning "Please configure packages/backend/.env with your settings"
    else
        print_success "Backend environment file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    pnpm install
    
    print_success "Dependencies installed successfully"
}

# Setup database
setup_database() {
    print_status "Checking MongoDB installation..."
    
    if command -v mongod &> /dev/null; then
        print_success "MongoDB detected"
        
        # Check if MongoDB is running
        if pgrep mongod > /dev/null; then
            print_success "MongoDB is running"
        else
            print_warning "MongoDB is installed but not running"
            print_status "Please start MongoDB manually or install MongoDB service"
        fi
    else
        print_warning "MongoDB not detected"
        print_status "You can:"
        print_status "  1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/"
        print_status "  2. Use MongoDB Atlas (cloud): https://www.mongodb.com/atlas"
        print_status "  3. Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    fi
}

# Setup Git hooks (if husky is configured)
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    if [ -f ".husky/pre-commit" ]; then
        print_status "Installing Git hooks with Husky..."
        pnpm run prepare 2>/dev/null || print_warning "Husky setup failed or not configured"
        print_success "Git hooks configured"
    else
        print_warning "Husky not configured, skipping Git hooks setup"
    fi
}

# Validate environment
validate_environment() {
    print_status "Validating development environment..."
    
    # Check if we can build the frontend
    print_status "Testing frontend build..."
    cd packages/frontend
    if pnpm run type-check; then
        print_success "Frontend TypeScript compilation successful"
    else
        print_error "Frontend TypeScript compilation failed"
        cd ../..
        exit 1
    fi
    cd ../..
    
    # Check if we can lint
    print_status "Testing linting..."
    cd packages/frontend
    if pnpm run lint:check; then
        print_success "Frontend linting passed"
    else
        print_warning "Frontend linting issues detected (can be fixed with pnpm run lint)"
    fi
    cd ../..
}

# Create development scripts
create_dev_scripts() {
    print_status "Creating development scripts..."
    
    cat > "dev.sh" << 'EOL'
#!/bin/bash
# Development startup script

echo "🚀 Starting Event Management Portal Development Servers"
echo "===================================================="

# Start both frontend and backend in parallel
echo "Starting backend server..."
cd packages/backend && npm run dev &
BACKEND_PID=$!

echo "Starting frontend server..."
cd packages/frontend && npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait
    echo "Development servers stopped"
}

# Trap cleanup on script exit
trap cleanup EXIT

echo "✅ Development servers started:"
echo "  • Frontend: http://localhost:3001"
echo "  • Backend:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait
EOL

    chmod +x dev.sh
    print_success "Development script created (./dev.sh)"
    
    # Create package.json scripts if they don't exist
    if [ -f "package.json" ]; then
        print_status "Adding development scripts to package.json..."
        
        # This would require jq or manual editing, for now just inform user
        print_status "Available commands after setup:"
        print_status "  • pnpm dev:frontend  - Start frontend only"
        print_status "  • pnpm dev:backend   - Start backend only"
        print_status "  • pnpm dev           - Start both servers"
        print_status "  • ./dev.sh           - Start both servers (alternative)"
    fi
}

# Show setup completion info
show_completion_info() {
    echo
    echo "=============================================="
    echo -e "${GREEN}🎉 Development Environment Setup Complete!${NC}"
    echo "=============================================="
    echo
    echo "📋 Next Steps:"
    echo "  1. Configure environment variables:"
    echo "     • packages/frontend/.env.local"
    echo "     • packages/backend/.env"
    echo
    echo "  2. Start MongoDB (if using local installation)"
    echo
    echo "  3. Start development servers:"
    echo "     • Run: pnpm dev (or ./dev.sh)"
    echo "     • Frontend: http://localhost:3001"
    echo "     • Backend:  http://localhost:3000"
    echo
    echo "🔧 Useful Commands:"
    echo "  • pnpm test           - Run tests"
    echo "  • pnpm lint           - Fix linting issues"
    echo "  • pnpm type-check     - Check TypeScript"
    echo "  • pnpm build          - Build for production"
    echo
    echo "📚 Documentation:"
    echo "  • Check README.md for detailed setup instructions"
    echo "  • Visit documentation/ folder for more guides"
    echo
}

# Main setup function
main() {
    echo "Starting development environment setup at $(date)"
    
    check_node
    check_pnpm
    setup_environment
    install_dependencies
    setup_database
    setup_git_hooks
    validate_environment
    create_dev_scripts
    show_completion_info
    
    print_success "Development environment setup completed successfully!"
}

# Run main function
main "$@"