# Developer Setup Guide

## 🚀 Welcome to Event Management Portal Development

This guide will help you set up a complete development environment for the Event Management Portal. The project is a TypeScript monorepo built with modern web development practices.

## 📋 Prerequisites

### Required Software

#### Node.js and Package Manager
```bash
# Install Node.js 18+ (LTS recommended)
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher

# Install pnpm (preferred package manager)
npm install -g pnpm

# Verify pnpm installation
pnpm --version  # Should be 8.0.0 or higher
```

#### Git
```bash
# Install Git
# Download from: https://git-scm.com/

# Configure Git (first time setup)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Docker (Optional but Recommended)
```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop/

# Verify installation
docker --version          # Should be 20.0.0 or higher
docker-compose --version  # Should be 2.0.0 or higher
```

### Development Tools

#### Visual Studio Code (Recommended)
- **Download**: https://code.visualstudio.com/
- **Extensions**: Automatically recommended when you open the workspace

#### Required VS Code Extensions
The workspace includes recommended extensions that will be suggested automatically:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers",
    "streetsidesoftware.code-spell-checker",
    "gruntfuggly.todo-tree"
  ]
}
```

### External Services Setup

#### MongoDB
You can use either MongoDB Atlas (cloud) or local MongoDB:

**Option 1: MongoDB Atlas (Recommended for Development)**
1. Create account at https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string
4. Add your IP to whitelist

**Option 2: Local MongoDB**
```bash
# Using Docker (easiest)
docker run -d --name mongodb -p 27017:27017 mongo:7.0

# Or install locally
# Ubuntu/Debian:
sudo apt install mongodb

# macOS with Homebrew:
brew install mongodb/brew/mongodb-community
```

#### Redis
```bash
# Using Docker (recommended for development)
docker run -d --name redis -p 6379:6379 redis:7.0-alpine

# Or install locally
# Ubuntu/Debian:
sudo apt install redis-server

# macOS with Homebrew:
brew install redis
```

#### Cloudinary Account
1. Create account at https://cloudinary.com/
2. Get your cloud name, API key, and API secret from dashboard
3. Note down for environment configuration

## 🛠️ Project Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/YourOrg/Event-Management-Portal.git
cd Event-Management-Portal

# Switch to development branch
git checkout development  # or main if working directly on main
```

### 2. Install Dependencies

```bash
# Install all dependencies for the monorepo
pnpm install

# This will install dependencies for:
# - Root workspace
# - packages/backend
# - packages/shared
# - packages/frontend (when available)
```

### 3. Environment Configuration

#### Development Environment
```bash
# Copy the environment template
cp .env.example .env.development

# Edit the development environment file
# Use your preferred editor (VS Code, nano, vim, etc.)
code .env.development
```

#### Environment Variables Configuration

Create `.env.development` with the following content:

```env
#==============================================
# APPLICATION CONFIGURATION
#==============================================
NODE_ENV=development
PORT=3000

# Application URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3001

#==============================================
# DATABASE CONFIGURATION
#==============================================
# MongoDB - Use Atlas or local
# Atlas example:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventmanagement_dev?retryWrites=true&w=majority

# Local MongoDB example:
# MONGODB_URI=mongodb://localhost:27017/eventmanagement_dev

# Redis - Local or cloud
REDIS_URL=redis://localhost:6379

#==============================================
# JWT CONFIGURATION
#==============================================
# Generate secure secrets for development
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

#==============================================
# CLOUDINARY CONFIGURATION
#==============================================
# Get these from your Cloudinary dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

#==============================================
# EMAIL CONFIGURATION (Development)
#==============================================
# For development, you can use Gmail with app password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL=noreply@localhost
FROM_NAME=Event Management Portal (Dev)

# Alternative: Use Ethereal (fake SMTP for testing)
# SMTP_HOST=smtp.ethereal.email
# SMTP_PORT=587
# SMTP_USER=ethereal_user
# SMTP_PASS=ethereal_pass

#==============================================
# DEVELOPMENT CONFIGURATION
#==============================================
# Logging
LOGGING_LEVEL=debug
ENABLE_REQUEST_LOGGING=true

# Development features
ENABLE_CORS=true
TRUST_PROXY=false

# Monitoring (optional in development)
PROMETHEUS_ENABLED=false
GRAFANA_ENABLED=false

#==============================================
# SECURITY CONFIGURATION
#==============================================
# Session configuration
SESSION_SECRET=dev_session_secret

# Rate limiting (relaxed for development)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200  # Higher limit for development

# File upload limits
MAX_UPLOAD_SIZE=10485760  # 10MB

#==============================================
# DEVELOPMENT TOOLS
#==============================================
# Enable detailed error responses
DETAILED_ERRORS=true

# Database debugging
MONGOOSE_DEBUG=true

# API Documentation
SWAGGER_ENABLED=true
```

### 4. Database Setup

#### Initialize Development Database
```bash
# Start your MongoDB and Redis services
# If using Docker:
docker start mongodb redis

# If using local services:
# MongoDB usually starts automatically
# Redis: sudo systemctl start redis (Linux) or brew services start redis (macOS)

# The application will automatically create collections on first run
# No manual database setup required
```

#### Sample Data (Optional)
```bash
# Run the seed script to populate with sample data
pnpm --filter backend seed

# This will create:
# - Sample users (including admin account)
# - Sample events
# - Sample clubs
# - Sample announcements
```

## 🏃‍♂️ Running the Development Environment

### Option 1: Full Development Mode

```bash
# Start all services in development mode
pnpm dev

# This starts:
# - Backend server with hot reload (port 3000)
# - Shared package in watch mode
# - TypeScript compilation in watch mode
```

### Option 2: Start Individual Packages

```bash
# Backend only
pnpm --filter backend dev

# Shared package only (if making changes to shared code)
pnpm --filter shared dev

# Build shared package first if needed
pnpm --filter shared build
```

### Option 3: Docker Development Environment

```bash
# Start development environment with Docker
pnpm docker:dev

# This starts:
# - Application containers
# - MongoDB container
# - Redis container
# - Development tools
```

### Verify Setup

Once everything is running, verify your setup:

```bash
# Check backend health
curl http://localhost:3000/api/health

# Expected response:
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2024-12-03T10:30:00Z",
    "database": "connected",
    "redis": "connected"
  }
}

# Check API documentation (if Swagger is enabled)
# Visit: http://localhost:3000/api-docs
```

## 🧪 Development Workflow

### Daily Development Routine

1. **Start Development Environment**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Install any new dependencies
   pnpm install
   
   # Start development servers
   pnpm dev
   ```

2. **Make Changes**
   - Edit code in `packages/backend/src/` or `packages/shared/src/`
   - Hot reload will automatically restart the server
   - TypeScript will check for type errors

3. **Testing**
   ```bash
   # Run tests
   pnpm test
   
   # Run tests in watch mode
   pnpm test:watch
   
   # Run specific tests
   pnpm --filter backend test src/controllers/auth.test.ts
   ```

4. **Code Quality**
   ```bash
   # Lint code
   pnpm lint
   
   # Fix linting issues
   pnpm lint:fix
   
   # Format code
   pnpm format
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Stage and commit changes
git add .
git commit -m "feat: add your feature description"

# Push changes
git push origin feature/your-feature-name

# Create pull request via GitHub/GitLab interface
```

### Debugging

#### VS Code Debugging
The workspace includes debug configurations:

1. **Press F5** to start debugging
2. **Set breakpoints** in your TypeScript code
3. **Use debug console** for interactive debugging

#### Manual Debugging
```bash
# Start backend in debug mode
pnpm --filter backend debug

# Connect with VS Code debugger or Chrome DevTools
# Debug URL: chrome://inspect
```

### Working with Database

#### MongoDB Compass (Recommended GUI)
1. Download MongoDB Compass
2. Connect to your MongoDB instance
3. Browse collections and documents

#### Command Line Access
```bash
# Connect to local MongoDB
mongosh

# Switch to your development database
use eventmanagement_dev

# Show collections
show collections

# Query users collection
db.users.find().pretty()
```

## 🔧 Development Tools and Scripts

### Available Scripts

```bash
# Development
pnpm dev                    # Start all packages in development
pnpm build                  # Build all packages
pnpm start                  # Start production build

# Testing
pnpm test                   # Run all tests
pnpm test:watch            # Run tests in watch mode
pnpm test:coverage         # Run tests with coverage report

# Code Quality
pnpm lint                   # Lint all packages
pnpm lint:fix              # Fix linting issues
pnpm format                # Format code with Prettier
pnpm type-check            # Check TypeScript types

# Database
pnpm --filter backend seed  # Seed development database
pnpm --filter backend migrate  # Run database migrations

# Utilities
pnpm clean                  # Clean all build outputs
pnpm reset                  # Clean and reinstall all dependencies
```

### Package-Specific Scripts

```bash
# Backend package
pnpm --filter backend start        # Start backend server
pnpm --filter backend build        # Build backend
pnpm --filter backend test         # Run backend tests
pnpm --filter backend seed         # Seed database

# Shared package
pnpm --filter shared build         # Build shared package
pnpm --filter shared test          # Run shared tests
pnpm --filter shared type-check    # Check types in shared package
```

### Useful Development Commands

```bash
# Check dependency tree
pnpm list --depth=0

# Update dependencies
pnpm update

# Add dependency to specific package
pnpm --filter backend add express
pnpm --filter backend add -D @types/express

# Remove dependency
pnpm --filter backend remove package-name

# Check for outdated packages
pnpm outdated
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
```bash
# Kill process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### 2. MongoDB Connection Issues
```bash
# Check if MongoDB is running
# Docker:
docker ps | grep mongo

# Local service:
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Test connection
mongosh "mongodb://localhost:27017/eventmanagement_dev" --eval "db.runCommand('ping')"
```

#### 3. Redis Connection Issues
```bash
# Check if Redis is running
# Docker:
docker ps | grep redis

# Local service:
redis-cli ping  # Should return PONG

# Start Redis if not running
redis-server  # or brew services start redis (macOS)
```

#### 4. TypeScript Compilation Errors
```bash
# Clear TypeScript cache
pnpm --filter backend exec tsc --build --clean

# Rebuild shared package
pnpm --filter shared build

# Check TypeScript configuration
pnpm type-check
```

#### 5. Missing Environment Variables
```bash
# Validate environment configuration
pnpm --filter backend validate-env

# Check which variables are missing
node -e "console.log(Object.keys(process.env).filter(k => k.startsWith('MONGODB') || k.startsWith('JWT')))"
```

#### 6. Permission Issues (Linux/macOS)
```bash
# Fix npm/pnpm permission issues
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.pnpm

# Fix file permissions in project
chmod -R 755 node_modules
chmod +x scripts/*.sh
```

### Development Tips

#### VS Code Workspace
- Open the workspace file: `Event-Management-Portal.code-workspace`
- This provides optimal settings for the monorepo structure
- Includes recommended extensions and settings

#### Hot Reload Not Working
```bash
# Restart development server
pnpm dev

# Clear node_modules and reinstall
pnpm reset

# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

#### Performance Issues
```bash
# Check memory usage
node --max-old-space-size=4096 # Increase Node.js memory limit

# Use faster TypeScript compilation
pnpm --filter backend build --incremental

# Disable source maps in development (tsconfig.json)
"sourceMap": false
```

## 📚 Learning Resources

### Project Architecture
- [Monorepo Guide](../MONOREPO_GUIDE.md)
- [TypeScript Migration](../MIGRATION_ROADMAP.md)
- [API Documentation](API_DOCUMENTATION.md)

### Technologies Used
- **Express.js**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/
- **Mongoose**: https://mongoosejs.com/
- **Zod**: https://zod.dev/
- **Jest**: https://jestjs.io/
- **Turborepo**: https://turbo.build/

### Best Practices
- **Code Style**: Follow ESLint and Prettier configurations
- **Commit Messages**: Use conventional commits
- **Testing**: Write tests for new features
- **Documentation**: Update docs for API changes

## 🎯 Next Steps

After completing the setup:

1. **Explore the Codebase**
   - Start with `packages/backend/src/app.ts`
   - Review shared types in `packages/shared/src/types/`
   - Check test examples in `packages/backend/tests/`

2. **Create Your First Feature**
   - Follow the existing patterns in controllers
   - Add proper TypeScript types
   - Include unit tests
   - Update API documentation

3. **Join the Team**
   - Review open issues and pull requests
   - Join team Slack/Discord channels
   - Attend team meetings and standups

## 🆘 Getting Help

- **Documentation**: Check `/documentation` folder
- **Issues**: Create GitHub issue with detailed description
- **Team Chat**: Join development Slack/Discord channel
- **Code Review**: Create pull request for feedback

---

**Happy Coding! 🎉**

You're now ready to contribute to the Event Management Portal. If you encounter any issues not covered in this guide, please create an issue or reach out to the team.