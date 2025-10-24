# Event Management Portal

A comprehensive, production-ready event management system built as a TypeScript monorepo with modern web technologies. This application provides a complete platform for creating, managing, and participating in events with enterprise-grade features including monitoring, logging, and deployment automation.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, authentication, profile management with JWT
- **Event Management**: Create, edit, delete, browse events with rich metadata
- **Event Registration**: Seamless user registration system with confirmation
- **Club Management**: Organize events by clubs with detailed profiles
- **Administrative Controls**: Comprehensive admin panel for system management
- **Announcements**: System-wide announcements and notifications
- **Recruitment**: Job/position posting and application management
- **Advanced Security**: Multi-layer security with rate limiting and audit logs

### Technical Features
- **Monitoring & Observability**: Prometheus metrics, Grafana dashboards, health checks
- **Structured Logging**: Winston-based logging with audit trails
- **Production Ready**: Docker containerization, CI/CD pipelines, deployment automation
- **Type Safety**: 100% TypeScript coverage across all packages
- **Scalability**: Microservice-ready architecture with shared libraries
- **Performance**: Optimized builds, caching, and monitoring

## 🏗️ Architecture

This is a TypeScript monorepo built with modern development practices:

### Technology Stack

#### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with JWT tokens
- **File Storage**: Cloudinary integration
- **Email**: Nodemailer with template support
- **Validation**: Zod schemas
- **Testing**: Jest with supertest

#### Frontend (Planned - Next.js Migration)
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form with Zod validation

#### Infrastructure
- **Monorepo**: pnpm workspaces with Turborepo
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Prometheus + Grafana + Winston logging
- **Reverse Proxy**: Nginx with SSL termination

### Package Structure

```
packages/
├── backend/           # Express.js API server
├── frontend/          # Next.js application (planned)
├── shared/           # Shared TypeScript types and utilities
└── ui/               # Shared UI components (planned)
```

## 📋 Prerequisites

- **Node.js** v18+ 
- **pnpm** v8+ (package manager)
- **Docker** & **Docker Compose** (for containerized deployment)
- **Git** (version control)
- **MongoDB** (local or cloud instance)
- **Redis** (for caching and sessions)

### External Services
- **Cloudinary** account (for file uploads)
- **SMTP** service (for email notifications)

## 🚀 Quick Start

### Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/event-management-portal.git
cd event-management-portal
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Environment setup:**
```bash
# Copy environment template
cp .env.example .env.development

# Edit with your configuration
# See Environment Configuration section below
```

4. **Start development environment:**
```bash
# Start all services
pnpm dev

# Or start specific packages
pnpm dev --filter backend
pnpm dev --filter shared
```

### Production Deployment

For production deployment, use the automated deployment script:

```bash
# Quick deployment (checks prerequisites, builds, deploys)
./deploy.sh deploy

# Step-by-step deployment
./deploy.sh check      # Check prerequisites
./deploy.sh build      # Build application
./deploy.sh deploy     # Deploy with monitoring
```

## ⚙️ Environment Configuration

### Development Environment

Create `.env.development`:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/eventmanagement

# Redis
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_development_jwt_secret
JWT_REFRESH_SECRET=your_development_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (Get from cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@localhost

# CORS
CORS_ORIGIN=http://localhost:3001

# Monitoring
PROMETHEUS_ENABLED=true
LOGGING_LEVEL=debug
```

### Production Environment

For production, use `.env.production` with secure values:
- Strong JWT secrets (use `openssl rand -base64 32`)
- Production database URLs
- Real SMTP credentials
- Production domain configuration

## �‍♂️ Available Commands

### Root Level Commands

```bash
# Development
pnpm dev                    # Start all packages in development
pnpm build                  # Build all packages
pnpm test                   # Run all tests
pnpm lint                   # Lint all packages
pnpm clean                  # Clean all build outputs

# Production
pnpm build:prod             # Production build
pnpm start:prod             # Start production server
pnpm env:validate           # Validate environment configuration

# Docker
pnpm docker:build           # Build Docker images
pnpm docker:dev             # Start development with Docker
pnpm docker:prod            # Start production with Docker
```

### Package-Specific Commands

```bash
# Backend
pnpm --filter backend dev          # Start backend in development
pnpm --filter backend build        # Build backend
pnpm --filter backend test         # Run backend tests

# Shared
pnpm --filter shared build         # Build shared package
pnpm --filter shared test          # Run shared package tests
```

## 📁 Project Structure

```
Event-Management-Portal/
├── packages/
│   ├── backend/                 # Express.js API
│   │   ├── src/
│   │   │   ├── controllers/     # Route handlers
│   │   │   ├── models/          # Database models
│   │   │   ├── routes/          # API routes
│   │   │   ├── middlewares/     # Custom middleware
│   │   │   ├── services/        # Business logic
│   │   │   └── utils/           # Utilities
│   │   ├── tests/               # Test files
│   │   └── Dockerfile           # Backend container
│   │
│   ├── frontend/                # Next.js app (planned)
│   │   ├── src/
│   │   │   ├── app/             # App router pages
│   │   │   ├── components/      # React components
│   │   │   └── lib/             # Client utilities
│   │   └── Dockerfile           # Frontend container
│   │
│   └── shared/                  # Shared code
│       ├── src/
│       │   ├── types/           # TypeScript types
│       │   ├── utils/           # Shared utilities
│       │   ├── constants/       # Shared constants
│       │   ├── validators/      # Zod schemas
│       │   └── services/        # Shared services
│       └── package.json
│
├── monitoring/                  # Monitoring configuration
│   ├── prometheus/             # Prometheus config
│   ├── grafana/               # Grafana dashboards
│   └── alerts/                # Alert rules
│
├── documentation/              # Comprehensive documentation
├── scripts/                   # Utility scripts
├── docker-compose.yml         # Development containers
├── docker-compose.prod.yml    # Production containers
├── deploy.sh                  # Deployment automation
├── turbo.json                 # Turborepo configuration
└── pnpm-workspace.yaml        # Workspace configuration
```

## 📊 Monitoring & Observability

### Health Checks
- **Liveness**: `/api/health/live` - Basic application health
- **Readiness**: `/api/health/ready` - Application ready to serve traffic
- **Health**: `/api/health` - Comprehensive system health with metrics

### Metrics & Monitoring
- **Prometheus**: Available at `http://localhost:9090`
- **Grafana**: Available at `http://localhost:3001` (admin/admin)
- **Application Metrics**: `/api/metrics` - Prometheus format metrics

### Logging
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Audit Logs**: Security and business event tracking
- **Performance Logs**: Request/response timing and metrics

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run specific test suites
pnpm --filter backend test
pnpm --filter shared test
```

## 🚢 Deployment

### Docker Deployment

1. **Development Environment:**
```bash
docker-compose up -d
```

2. **Production Environment:**
```bash
./deploy.sh deploy
```

### Manual Deployment

1. **Build Application:**
```bash
pnpm install --frozen-lockfile
pnpm build:prod
```

2. **Setup Environment:**
```bash
cp .env.example .env.production
# Edit .env.production with production values
```

3. **Start Services:**
```bash
pnpm start:prod
```

## 📖 Documentation

Comprehensive documentation is available in the `/documentation` directory:

- [**Developer Setup**](documentation/DEVELOPER_SETUP.md) - Detailed development environment setup
- [**API Documentation**](documentation/API_DOCUMENTATION.md) - Complete API reference
- [**Database Schema**](documentation/DATABASE_SCHEMA.md) - Database design and relationships
- [**Deployment Guide**](documentation/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [**Security Guide**](documentation/AUTHENTICATION_SECURITY.md) - Security implementation details
- [**Testing Guide**](documentation/TESTING_GUIDE.md) - Testing strategies and examples
- [**Monitoring Guide**](documentation/MONITORING_GUIDE.md) - Observability and monitoring setup

## 🔒 Security

- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Configurable rate limiting per endpoint
- **Security Headers**: Helmet.js security headers
- **Audit Logging**: Comprehensive security event logging
- **Environment Security**: Secure environment variable management

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** with proper TypeScript typing
4. **Add tests** for new functionality
5. **Ensure all tests pass**: `pnpm test`
6. **Lint your code**: `pnpm lint`
7. **Commit your changes**: `git commit -m "feat: add your feature"`
8. **Push to your branch**: `git push origin feature/your-feature-name`
9. **Create a Pull Request**

### Code Standards

- **TypeScript**: 100% type coverage, no `any` types
- **Testing**: Minimum 80% code coverage
- **Linting**: ESLint + Prettier configuration
- **Commits**: Conventional commit messages
- **Documentation**: JSDoc for complex functions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## � Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/event-management-portal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/event-management-portal/discussions)
- **Documentation**: See `/documentation` directory
- **Email**: support@yourdomain.com

## �️ Roadmap

- [x] **Phase 1**: TypeScript Migration (Backend)
- [x] **Phase 2**: API Modernization (JSON APIs)
- [x] **Phase 3**: Monorepo Setup (Turborepo + pnpm)
- [x] **Phase 4**: Shared Package Infrastructure
- [x] **Phase 5**: Production Deployment & Monitoring
- [ ] **Phase 6**: Next.js Frontend Development
- [ ] **Phase 7**: Performance Optimization
- [ ] **Phase 8**: Advanced Features (Real-time notifications, etc.)

## 🏆 Acknowledgments

- Built with modern TypeScript and Node.js best practices
- Monitoring powered by Prometheus and Grafana
- UI components planned with shadcn/ui
- Deployment automation with Docker and GitHub Actions
