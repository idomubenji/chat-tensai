#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Create deployment directory if it doesn't exist
ssh -i ~/.ssh/chat-genius-ec2.pem ec2-user@44.200.83.77 'mkdir -p ~/chat-genius'

# Copy only the necessary files to EC2
echo "Copying files to EC2..."
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next/cache' \
    --exclude 'coverage' \
    --exclude '.env.local' \
    --exclude '.env.development' \
    --exclude 'tests' \
    --exclude '__tests__' \
    -e "ssh -i ~/.ssh/chat-genius-ec2.pem" \
    .next \
    package.json \
    package-lock.json \
    .env.production \
    next.config.js \
    ecosystem.config.js \
    scripts \
    public \
    ec2-user@44.200.83.77:~/chat-genius/

# SSH into the instance and set up the environment
echo "Setting up the environment..."
ssh -i ~/.ssh/chat-genius-ec2.pem ec2-user@44.200.83.77 'bash -s' << 'ENDSSH'
    cd ~/chat-genius
    # Install Node.js if not already installed
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo yum install -y nodejs
    fi
    
    # Install dependencies
    npm install --production
    
    # Install PM2 if not already installed
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi
    
    # Start the application with PM2
    pm2 delete chat-genius 2>/dev/null || true
    pm2 start ecosystem.config.js
    
    # Save PM2 process list and configure to start on reboot
    pm2 save
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
ENDSSH

echo "Deployment completed!" 