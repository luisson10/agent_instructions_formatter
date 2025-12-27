# Stage 1: Build the application
FROM node:20-alpine as builder

WORKDIR /app

# Copiamos solo los archivos de dependencias primero
COPY package*.json ./

# Cache buster: 2025-12-27-v2
# Usamos install --force para evitar errores de peerDependencies con React 19
RUN npm install --force

COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
