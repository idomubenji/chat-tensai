#!/bin/bash

# Install Nginx if not already installed
sudo yum update -y
sudo yum install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo tee /etc/nginx/conf.d/chat-genius.conf << 'EOL'
# HTTP server (redirects to HTTPS)
server {
    listen 80;
    server_name _;  # Replace with your domain if you have one

    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl;
    server_name _;  # Replace with your domain if you have one

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain/fullchain.pem;  # Will be updated by certbot
    ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;  # Will be updated by certbot
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Increase max body size for file uploads
    client_max_body_size 50M;

    # Serve static files directly
    location /_next/static/ {
        alias /home/ec2-user/chat-genius/.next/static/;
        expires 365d;
        access_log off;
    }

    location /static/ {
        alias /home/ec2-user/chat-genius/public/;
        expires 365d;
        access_log off;
    }

    # Proxy all other requests to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOL

# Remove default nginx config
sudo rm -f /etc/nginx/conf.d/default.conf

# Test Nginx configuration
sudo nginx -t

# Start Nginx and enable on boot
sudo systemctl start nginx
sudo systemctl enable nginx

# Update SELinux if enabled
if command -v sestatus >/dev/null 2>&1; then
    sudo setsebool -P httpd_can_network_connect 1
fi

echo "Nginx setup complete!"

# Instructions for SSL certificate setup
echo "
To complete HTTPS setup:
1. Replace 'your-domain' in the Nginx config with your actual domain
2. Run: sudo certbot --nginx -d your-domain.com
3. Follow the prompts to obtain and install SSL certificates
4. Certbot will automatically update the Nginx configuration
" 