#!/bin/bash
set -e  # Exit on error

echo "🔨 Testing production build..."

# Load production environment variables
if [ -f .env.production ]; then
  echo "Loading variables from .env.production..."
  export $(cat .env.production | grep -v '^#' | xargs)
else
  echo "⚠️  Warning: .env.production not found"
fi

# Verify critical environment variables
echo "Verifying environment variables..."
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-'not set'}"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-'not set'}"

# Clean previous build
echo "Cleaning previous build..."
rm -rf .next

# Set production environment
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"

# Run the build
echo "Starting production build..."
npm run build

echo "✅ Build completed successfully!" 