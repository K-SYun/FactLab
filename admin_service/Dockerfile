# Production build stage
FROM node:18-alpine as build-stage

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build React app for production
ENV ESLINT_NO_DEV_ERRORS=true
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Production stage - serve with Nginx
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built React files to Nginx
COPY --from=build-stage /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]