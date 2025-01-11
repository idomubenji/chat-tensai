#!/bin/bash

# Exit on error, but print the error message
error_handler() {
    local line_no=$1
    local error_code=$2
    echo "Error on line $line_no: Exit code $error_code"
    exit $error_code
}
trap 'error_handler ${LINENO} $?' ERR

echo "Setting up production environment..."
export NODE_ENV=production

echo "Creating log directory..."
mkdir -p logs

echo "Installing production dependencies first..."
npm install --omit=dev --verbose

echo "Installing dev dependencies..."
npm install --save-dev typescript@latest @types/node@latest eslint@latest @typescript-eslint/parser@latest @typescript-eslint/eslint-plugin@latest --verbose

echo "Building application..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "Cleaning up dev dependencies..."
npm prune --production

echo "Starting application with PM2..."
pm2 delete chat-genius 2>/dev/null || true

echo "Starting server..."
pm2 start ecosystem.config.js --env production

echo "Saving PM2 process list..."
pm2 save

echo "Setup complete! Application should be running."
echo "Check status with: pm2 list"
echo "View logs with: pm2 logs chat-genius"

# Print current process status
echo "Current PM2 processes:"
pm2 list

# Print recent logs
echo "Recent application logs:"
pm2 logs chat-genius --lines 20 || true
