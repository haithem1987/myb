# Stage 1: Build the Angular application
FROM node:20 AS build

# Install the Nx CLI globally
RUN npm install -g nx

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json/yarn.lock
COPY package*.json ./


# Install dependencies
RUN npm install --force

# Copy the Nx workspace files
COPY . .

# Build the Angular application (replace 'your-angular-app' with the actual project name)
RUN npx nx build client --configuration=production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built Angular app from the previous stage
COPY --from=build /app/dist/apps/client /usr/share/nginx/html

# Copy Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
