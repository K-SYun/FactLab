FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf/nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]