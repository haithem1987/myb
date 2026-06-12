# Multi-stage Dockerfile for Angular Nx Monorepo
#
# APPROACH: Prebuild dist locally, then copy to nginx
# This avoids ng-packagr rootDir issues in Docker build context
#
# Build command: 
#   cd src/front/myb.front && npx nx build admin --configuration=production
#   cd ../../.. && docker compose build myb-front

FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy prebuilt Angular admin app (path relative to docker-compose context root)
COPY src/front/myb.front/dist/apps/admin /usr/share/nginx/html

# Copy nginx configuration for SPA routing
COPY src/front/myb.front/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
