#!/bin/bash
set -e

echo "Creating test deployment directory..."
rm -rf ~/test-deploy
mkdir -p ~/test-deploy

echo "Building the application..."
NODE_ENV=production npm run build

echo "Creating deployment package..."
tar -czf deploy.tar.gz \
  .next/standalone \
  .next/static \
  public \
  ecosystem.config.js \
  .env.production

echo "Extracting deployment package..."
tar -xzf deploy.tar.gz -C ~/test-deploy

echo "Setting up static files..."
cd ~/test-deploy
mkdir -p .next/standalone/.next/static
cp -r .next/static/* .next/standalone/.next/static/
cp -r public/* .next/standalone/public/
cp .env.production .next/standalone/
cp ecosystem.config.js .next/standalone/

echo "Starting application with PM2..."
pm2 delete chat-genius-test 2>/dev/null || true
cd .next/standalone
NODE_ENV=production PORT=3001 pm2 start server.js --name "chat-genius-test"

echo "Test deployment complete! App should be running on http://localhost:3001"
echo "Check logs with: pm2 logs chat-genius-test"
echo "Stop test deployment with: pm2 delete chat-genius-test" 