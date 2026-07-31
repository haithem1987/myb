# Dockerfile for Client Frontend (Angular/Nx - Owner Portal)
# Multi-stage build for optimized image size

# Stage 1: Build the Angular application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY src/front/myb.front/package*.json ./
COPY src/front/myb.front/nx.json ./
COPY src/front/myb.front/tsconfig.base.json ./
COPY src/front/myb.front/jest.preset.js ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source files
COPY src/front/myb.front/apps/client ./apps/client
COPY src/front/myb.front/libs ./libs

# Build the client app
ENV NX_NO_CLOUD=true
RUN npx nx build client --configuration=ovhcloud --skip-nx-cache

# Stage 2: Serve with NGINX
FROM nginx:1.25-alpine

# Copy custom nginx configuration
COPY ovhcloud/docker/client/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/client /usr/share/nginx/html/client

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
