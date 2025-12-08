# Stage 1: Build the Angular application for linux/amd64
FROM --platform=linux/amd64 node:20 AS build

# Install the Nx CLI globally
RUN npm install -g nx

# Set the working directory
WORKDIR /app

# Copy all source files (workspace root) into the container
COPY . .

# Install dependencies
RUN npm install --force

# Build the Angular application (adjust 'client' to your project name)
# Skip Nx cloud cache to avoid invalid cache errors
RUN npx nx reset && \
    npx nx build client --configuration=production --skip-nx-cache

# Stage 2: Serve the application with Nginx for linux/amd64
FROM --platform=linux/amd64 nginx:alpine AS runtime

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy the built Angular app from the previous stage
COPY --from=build /app/dist/apps/client /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
