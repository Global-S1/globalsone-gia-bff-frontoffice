# Stage 1: Dependencies & Development
FROM node:20-alpine AS development

WORKDIR /app
ENV NODE_ENV=development
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

# Stage 2: Build for Production
FROM development AS builder
RUN pnpm build

# Stage 3: Production Runtime
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/build ./build
COPY --from=builder /app/config ./config

# Pre-create uploads dir owned by nodejs so the named volume inherits the ownership
# on first mount (Docker copies the perms of the underlying path into the empty volume).
RUN mkdir -p /app/uploads/vouchers && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://localhost:${APP_PORT:-3100}/v1/health/live" || exit 1

CMD ["node", "build/index.js"]
