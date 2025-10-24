# Environment & Configuration Guide

## 🔧 Environment Setup

This guide covers the comprehensive environment configuration for the Event Management Portal, including development, staging, and production setups.

## 📋 Prerequisites

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **pnpm**: Install with `npm install -g pnpm`
- **MongoDB**: Local installation or MongoDB Atlas
- **Cloudinary Account**: For file uploads
- **Docker** (for production): For containerized deployment

## 🚀 Quick Setup

### Automated Setup
```bash
# Run the automated setup script
pnpm run setup

# Or manually:
bash scripts/setup-dev.sh
```

### Manual Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd Event-Management-Portal
pnpm install
```

2. **Environment Configuration**
```bash
# Frontend
cp packages/frontend/.env.example packages/frontend/.env.local

# Backend (if exists)
cp packages/backend/.env.example packages/backend/.env
```

3. **Configure Environment Variables**
Edit the `.env.local` files with your configuration (see below).

## 📝 Environment Variables

### Frontend Configuration (`packages/frontend/.env.local`)

#### Required Variables
```bash
# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Authentication
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-super-secret-nextauth-secret-key-min-32-chars
MONGODB_URI=mongodb://localhost:27017/event-management

# Cloudinary (Required for file uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=event-management-uploads
```

#### Optional Variables
```bash
# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password

# Analytics & Monitoring
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
SENTRY_DSN=your-sentry-dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

## 🏗️ Service Configuration

### Cloudinary Setup

1. **Create Account**: Sign up at [cloudinary.com](https://cloudinary.com/)
2. **Get Credentials**: Navigate to Dashboard → Settings → Security
3. **Create Upload Preset**: 
   - Go to Settings → Upload → Add upload preset
   - Set name to: `event-management-uploads`
   - Set signing mode to: `Unsigned`
   - Configure folder: `event-management`

### MongoDB Setup

#### Option 1: Local MongoDB
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify connection
mongosh mongodb://localhost:27017/event-management
```

#### Option 2: MongoDB Atlas
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Get connection string
4. Update `MONGODB_URI` in environment files

#### Option 3: Docker MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### Authentication Setup

#### NextAuth Configuration
NextAuth is configured in `packages/frontend/src/app/api/auth/[...nextauth]/route.ts`

#### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google`

## 🔄 Development Workflow

### Start Development Servers
```bash
# Start both frontend and backend
pnpm dev

# Or individually
pnpm dev:frontend  # http://localhost:3001
pnpm dev:backend   # http://localhost:3000
```

### Available Commands
```bash
# Development
pnpm dev              # Start development servers
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Lint and fix code
pnpm type-check       # TypeScript type checking

# Environment
pnpm env:validate     # Validate environment configuration
pnpm setup            # Run development setup script

# Production
pnpm deploy           # Deploy to production
pnpm deploy:prod      # Start production containers
pnpm deploy:down      # Stop production containers
```

## 🐳 Production Deployment

### Docker Deployment

1. **Prepare Environment**
```bash
cp .env.production.example .env.production
# Configure production variables
```

2. **Deploy with Docker Compose**
```bash
pnpm deploy:prod
# Or manually:
docker-compose -f docker-compose.prod.yml up -d
```

3. **Verify Deployment**
```bash
docker-compose -f docker-compose.prod.yml ps
curl http://localhost/health
```

### Manual Production Setup

1. **Build Applications**
```bash
pnpm build
```

2. **Configure Reverse Proxy**
Set up Nginx or similar to proxy requests to Node.js applications.

3. **Set up Process Manager**
Use PM2 or similar to manage Node.js processes.

## 🔍 Environment Validation

The application includes automatic environment validation:

```bash
# Validate current environment
pnpm env:validate

# The validation runs automatically during:
# - Development server start
# - Production build
# - Application initialization
```

### Validation Features
- ✅ Required variable presence
- ✅ URL format validation
- ✅ Secret length validation
- ✅ Database connection string format
- ✅ File size and type validation
- ✅ Feature flag parsing

## 🛡️ Security Considerations

### Development
- Use different secrets for development
- Never commit real credentials
- Use `.env.local` (gitignored) for local overrides

### Production
- Use strong, unique secrets (32+ characters)
- Enable HTTPS/SSL
- Configure CORS properly
- Use environment-specific database credentials
- Enable rate limiting
- Regular security audits

## 🔧 Troubleshooting

### Common Issues

#### Environment Validation Fails
```bash
# Check environment file exists
ls -la packages/frontend/.env.local

# Validate specific variables
node -e "console.log(process.env.NEXTAUTH_SECRET?.length)"
```

#### Cloudinary Upload Fails
- Verify cloud name and upload preset
- Check CORS settings in Cloudinary dashboard
- Ensure upload preset is unsigned

#### Database Connection Issues
```bash
# Test MongoDB connection
mongosh $MONGODB_URI

# Check if MongoDB is running
ps aux | grep mongod
```

#### Build Failures
```bash
# Clear cache and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

### Debug Mode
Enable debug mode for detailed logging:
```bash
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration)
- [Cloudinary Upload Widget](https://cloudinary.com/documentation/upload_widget)
- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🤝 Contributing

1. Follow the environment setup guide
2. Ensure all tests pass: `pnpm test`
3. Validate environment: `pnpm env:validate`
4. Check code quality: `pnpm lint && pnpm type-check`

For more detailed development guidelines, see `CONTRIBUTING.md`.