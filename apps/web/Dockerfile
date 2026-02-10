# ===========================================================================
# Pare Engine — Next.js Web App Dockerfile
# Owner: S22 (Production Deployment)
#
# Multi-stage build for the Next.js 15 web application.
# Produces a minimal production image with standalone output.
#
# Build context: repository root (run from pare-engine/)
# Usage: docker build -f apps/web/Dockerfile -t pare-web .
# ===========================================================================

# ---------------------------------------------------------------------------
# Stage 1: Dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy package.json files for all workspaces (for dependency resolution)
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/
COPY apps/audit-runner/package.json apps/audit-runner/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

# Copy dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy all source files
COPY . .

# Build the core package first (dependency of web)
RUN pnpm --filter @pare-engine/core build

# Build the Next.js app with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @pare-engine/web build

# ---------------------------------------------------------------------------
# Stage 3: Production Runner
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
