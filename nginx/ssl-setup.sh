#!/bin/bash

# SSL 인증서 설정 스크립트
# Let's Encrypt 인증서 자동 발급 및 갱신

# 1. Certbot 설치 (Ubuntu/Debian)
echo "Installing Certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# 2. SSL 인증서 발급
echo "Obtaining SSL certificate..."
certbot --nginx -d polradar.com -d www.polradar.com \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    --redirect

# 3. 자동 갱신 설정
echo "Setting up automatic renewal..."
crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -

# 4. 방화벽 설정
echo "Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow ssh
ufw --force enable

echo "SSL setup completed!"
echo "Test your site: https://polradar.com"