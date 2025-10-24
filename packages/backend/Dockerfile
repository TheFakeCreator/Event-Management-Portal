# =============================================================================
# Express.js Backend Production Dockerfile
# Event Management Portal - Backend API Service
# =============================================================================

# Base image with Node.js
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Set up working directory
WORKDIR /app

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# =============================================================================
# Dependencies stage
# =============================================================================
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY pnpm-workspace.yaml ./

# Copy shared and backend packages
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile --production=false

# =============================================================================
# Builder stage
# =============================================================================
FROM base AS builder

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY package.json pnpm-workspace.yaml turbo.json ./

# Set build environment
ENV NODE_ENV=production

# Build shared package first
RUN pnpm --filter @event-management/shared build:prod

# Build backend
RUN pnpm --filter @event-management/backend build:prod

# =============================================================================
# Production runtime stage
# =============================================================================
FROM base AS runner

# Set production environment
ENV NODE_ENV=production

# Create api user for security
RUN addgroup --system --gid 1001 api && \
    adduser --system --uid 1001 api

# Copy built application
COPY --from=builder --chown=api:api /app/packages/backend/dist ./dist
COPY --from=builder --chown=api:api /app/packages/shared/dist ./shared

# Install production dependencies only
COPY --from=deps --chown=api:api /app/packages/backend/node_modules ./node_modules
COPY --from=builder --chown=api:api /app/packages/backend/package.json ./package.json

# Create logs directory
RUN mkdir -p /app/logs && chown api:api /app/logs

# Create healthcheck script
COPY --chown=api:api <<EOF /app/healthcheck.js
const http = require('http');
const options = {
  host: 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/v1/health',
  timeout: 5000,
  method: 'GET'
};

const request = http.request(options, (res) => {
  console.log(\`Health check status: \${res.statusCode}\`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', function(err) {
  console.log('Health check failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('Health check timeout');
  request.destroy();
  process.exit(1);
});

request.setTimeout(5000);
request.end();
EOF

# Set up proper permissions
RUN chown api:api /app/healthcheck.js && \
    chmod +x /app/healthcheck.js

# Switch to api user
USER api

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node /app/healthcheck.js

# Set runtime environment
ENV PORT=5000
ENV HOST="0.0.0.0"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "--enable-source-maps", "dist/app.js"]