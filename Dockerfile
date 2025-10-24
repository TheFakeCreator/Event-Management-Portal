# Production Multi-Stage Dockerfile for Event Management Portal
# This builds and runs the complete application stack

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.18.3

# Copy dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install pnpm in builder stage
RUN npm install -g pnpm@10.18.3

# Set environment to production for optimized builds
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build all packages
RUN pnpm build

# Production image for backend
FROM base AS backend-runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy backend build artifacts
COPY --from=builder /app/packages/backend/dist ./backend/dist
COPY --from=builder /app/packages/backend/package.json ./backend/
COPY --from=builder /app/packages/shared/dist ./shared/dist
COPY --from=builder /app/packages/shared/package.json ./shared/

# Install only production dependencies for backend
RUN npm install -g pnpm@10.18.3
COPY --from=builder /app/packages/backend/node_modules ./backend/node_modules

USER backend

EXPOSE 5000

CMD ["node", "backend/dist/app.js"]

# Production image for frontend
FROM base AS frontend-runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy frontend build artifacts
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public

USER nextjs

EXPOSE 3000

CMD ["node", "packages/frontend/server.js"]