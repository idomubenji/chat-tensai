#!/bin/bash

# Install Nginx if not already installed
sudo yum update -y
sudo yum install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/conf.d/chat-genius.conf << 'EOL'
server {
    listen 80;
    server_name _;  # Replace with your domain if you have one

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