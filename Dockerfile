# syntax=docker/dockerfile:1

FROM oven/bun:1.3.2-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Build stage (if needed for type checking)
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run typecheck

# Production stage
FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run as non-root user
USER bun

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun --version || exit 1

CMD ["bun", "run", "src/index.ts"]
