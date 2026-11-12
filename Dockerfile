# =========================================================
# Multi-Stage Production Dockerfile for SatQuery AI
# Node.js 20 Alpine Base - Optimized for minimal image size
# =========================================================

# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-libc-compat

# Stage 2: Dependencies installer
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm ci || npm install --legacy-peer-deps

# Stage 3: Build frontend & server bundles
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN npm run build

# Stage 4: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 satquery

# Copy production package manifesto & dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Copy built distribution bundle (Vite client assets + Express server)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Set ownership to non-root user
USER satquery

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "dist/server.js"]
