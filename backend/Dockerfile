# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund --loglevel=error

# Copy source code
COPY src ./src
COPY templates ./templates

# Build application
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --no-audit --no-fund --loglevel=error && npm cache clean --force --loglevel=error

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/templates ./templates

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get(`http://127.0.0.1:${process.env.PORT || 3000}/health`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]

