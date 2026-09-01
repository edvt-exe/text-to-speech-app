# Stage 1: Builder
# WHY: Multi-stage build reduces final image size by excluding build dependencies
# node-gyp (required by better-sqlite3) needs build tools, but we don't need them in production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first
# WHY: Leverage Docker layer caching - if dependencies don't change, this layer is cached
COPY backend/package*.json ./backend/

WORKDIR /app/backend

# Install dependencies including build tools (needed for better-sqlite3 native module)
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Runtime (Production Image)
# WHY: Start fresh without build tools to minimize image size (~200MB vs ~800MB without multi-stage)
FROM node:20-alpine

# Add labels for container metadata
LABEL maintainer="VoiceCraft"
LABEL description="VoiceCraft - Text-to-Speech Audio Generation with Rate Limiting, Caching, and Social Sharing"

WORKDIR /app/backend

# Copy dependencies from builder stage
COPY --from=builder /app/backend/node_modules ./node_modules

# Copy application code
COPY backend/ ./

# Create directory for audio output persistence
# WHY: Explicit directory creation ensures the volume mount point exists
RUN mkdir -p /app/backend/audio-output

# Create a non-root user for security
# WHY: Running as root in containers is a security risk. Limiting permissions to app user
# prevents potential security breaches from affecting the host system
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose the application port
EXPOSE 3000

# Health check
# WHY: Docker can automatically restart unhealthy containers. The health check
# queries the /api/tts/history endpoint which exercises the database connection
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/tts/history', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application with Node process manager flags
# WHY: 
# - exec form (array) ensures signals are properly passed (important for graceful shutdown)
# - NODE_ENV=production enables Express optimizations
# - --unhandled-rejections=strict catches unhandled promise rejections
ENV NODE_ENV=production

CMD ["node", "--unhandled-rejections=strict", "server.js"]
