# Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY shared/types/package.json ./shared/types/
COPY shared/constants/package.json ./shared/constants/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY shared ./shared
COPY backend ./backend

# Generate Prisma client
WORKDIR /app/backend
RUN pnpm prisma generate

# Build the application
WORKDIR /app
RUN pnpm build:shared && pnpm build:backend

# Production stage
FROM node:18-alpine

# Install pnpm and dumb-init
RUN corepack enable && corepack prepare pnpm@8 --activate && \
    apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY shared/types/package.json ./shared/types/
COPY shared/constants/package.json ./shared/constants/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/shared/types/dist ./shared/types/dist
COPY --from=builder /app/shared/constants/dist ./shared/constants/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma

# Switch to non-root user
USER nodejs

WORKDIR /app/backend

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]