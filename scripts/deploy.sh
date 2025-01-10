#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.production

# Install dependencies
npm install

# Build the application
npm run build

# Start with PM2
pm2 delete chat-genius || true
pm2 start npm --name "chat-genius" -- start

# Save PM2 process list
pm2 save

# Display status
pm2 status 