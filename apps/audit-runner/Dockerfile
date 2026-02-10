# ===========================================================================
# Pare Engine — Audit Runner (Inngest Worker) Dockerfile
# Owner: S22 (Production Deployment)
#
# Multi-stage build for the Inngest-powered audit pipeline worker.
# Includes Chromium for Puppeteer PDF generation.
#
# Build context: repository root (run from pare-engine/)
# Usage: docker build -f apps/audit-runner/Dockerfile -t pare-audit-runner .
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
COPY --from=deps /app/apps/audit-runner/node_modules ./apps/audit-runner/node_modules

# Copy all source files
COPY . .

# Build the core package first (dependency of audit-runner)
RUN pnpm --filter @pare-engine/core build

# Build the audit runner
RUN pnpm --filter @pare-engine/audit-runner build

# ---------------------------------------------------------------------------
# Stage 3: Production Runner
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install Chromium for Puppeteer PDF generation and dumb-init for PID 1
RUN apk add --no-cache \
    dumb-init \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 runner && \
    adduser --system --uid 1001 runner

# Copy built output
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/src/report-templates ./packages/core/src/report-templates
COPY --from=builder /app/apps/audit-runner/dist ./apps/audit-runner/dist
COPY --from=builder /app/apps/audit-runner/package.json ./apps/audit-runner/

# Copy node_modules (production only)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/apps/audit-runner/node_modules ./apps/audit-runner/node_modules

# Copy workspace config for module resolution
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Set ownership
RUN chown -R runner:runner /app

USER runner

# Environment
ENV NODE_ENV=production
ENV PORT=3001

# Puppeteer configuration — use system Chromium, no download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Inngest configuration
# INNGEST_SIGNING_KEY and INNGEST_EVENT_KEY set via .env
ENV INNGEST_SERVE_ORIGIN=http://localhost:3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/audit-runner/dist/index.js"]
