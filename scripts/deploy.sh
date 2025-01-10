#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.production

# Install dependencies
npm install

# Build the application with type checking and linting disabled
NODE_OPTIONS="--max_old_space_size=4096" next build --no-lint --no-typescript

# Start/Restart with PM2
if pm2 list | grep -q "chat-genius"; then
    # Restart if exists
    pm2 restart chat-genius
else
    # Start if doesn't exist
    pm2 start npm --name "chat-genius" -- start
fi

# Save PM2 process list
pm2 save

# Display status
pm2 status 