#!/bin/bash

# Exit on error
set -e

# Load environment variables
set -a # automatically export all variables
source .env.production
set +a

# Print environment variables for debugging (excluding sensitive data)
echo "Checking environment variables:"
echo "NEXT_PUBLIC_PRODUCTION_SUPABASE_URL is set: $(if [ -n "$NEXT_PUBLIC_PRODUCTION_SUPABASE_URL" ]; then echo "yes"; else echo "no"; fi)"
echo "NEXT_PUBLIC_SUPABASE_URL is set: $(if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then echo "yes"; else echo "no"; fi)"

# Install dependencies
npm install

# Build the application with type checking and linting disabled
export NODE_OPTIONS="--max_old_space_size=4096"
export NEXT_DISABLE_ESLINT=1
export NEXT_DISABLE_TYPE_CHECKS=1
npm run build

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