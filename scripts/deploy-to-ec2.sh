#!/bin/bash
set -e  # Exit on error

EC2_HOST="44.200.83.77"
EC2_USER="ec2-user"
SSH_KEY="~/.ssh/chat-genius-ec2.pem"

echo "🚀 Starting deployment process..."

# Run the prepare-deploy script
echo "📦 Preparing deployment package..."
./scripts/prepare-deploy.sh

# Copy the package to EC2
echo "📤 Copying deployment package to EC2..."
scp -i $SSH_KEY deploy.tar.gz $EC2_USER@$EC2_HOST:~

# Execute deployment commands on EC2
echo "🔧 Deploying on EC2..."
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
cd ~
rm -rf chat-genius
mkdir chat-genius
cd chat-genius
tar -xzf ../deploy.tar.gz
./start.sh
ENDSSH

echo "✨ Deployment complete! Your application should now be running on EC2."
echo "To check status: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'pm2 list'"
echo "To view logs: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'pm2 logs chat-genius'" 