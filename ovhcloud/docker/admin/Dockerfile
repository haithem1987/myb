# Dockerfile for Admin Frontend (Angular/Nx)
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
ENV CYPRESS_INSTALL_BINARY=0
RUN npm ci --legacy-peer-deps

# Copy source files
COPY src/front/myb.front/apps/admin ./apps/admin
COPY src/front/myb.front/libs ./libs
# @env/environment alias in tsconfig.base.json always resolves to apps/client/src/environments
# shared libs also reference apps/client/src/assets/images via CSS
COPY src/front/myb.front/apps/client/src/environments ./apps/client/src/environments
COPY src/front/myb.front/apps/client/src/assets ./apps/client/src/assets

# Build the admin app
ENV NX_NO_CLOUD=true
RUN npx nx build admin --configuration=ovhcloud

# Stage 2: Serve with NGINX
FROM nginx:1.25-alpine

# Copy custom nginx configuration
COPY ovhcloud/docker/admin/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/admin /usr/share/nginx/html/admin

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/admin/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
