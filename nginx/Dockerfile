FROM nginx:alpine

# Copy nginx configuration
COPY nginx-prod.conf /etc/nginx/nginx.conf

# Copy error pages
COPY 404.html /usr/share/nginx/html/404.html
COPY 503.html /usr/share/nginx/html/503.html

# Expose ports
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]