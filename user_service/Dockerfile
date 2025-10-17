# Production build stage
FROM node:20 as build-stage

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build React app for production
ENV NODE_ENV=production
ENV REACT_APP_API_URL=https://www.polradar.com/api
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Remove console.log from production build (keep console.error and console.warn)
RUN find /app/build/static/js -name "*.js" -type f -exec sed -i.bak -E 's/console\.(log|info|debug)\([^)]*\);//g' {} \; && \
    find /app/build/static/js -name "*.js.bak" -type f -delete

# Production stage - serve with Nginx
FROM nginx:alpine

# Copy built React files to Nginx
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy custom Nginx config if exists
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
