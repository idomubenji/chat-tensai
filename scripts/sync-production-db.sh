#!/bin/bash

# Exit on error
set -e

echo "🔄 Syncing database schema with production..."

# Make sure we have both environment files
if [ ! -f ".env.local" ] || [ ! -f ".env.production" ]; then
    echo "❌ Error: Missing environment files. Need both .env.local and .env.production"
    exit 1
fi

# Pull the current schema from development
echo "📥 Pulling current schema from development..."
npx supabase db dump -f supabase/migrations/schema.sql

# Switch to production URL temporarily
source .env.production
ORIGINAL_URL=$NEXT_PUBLIC_SUPABASE_URL
ORIGINAL_KEY=$SUPABASE_SERVICE_ROLE_KEY
export NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_PRODUCTION_SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY=$PRODUCTION_SUPABASE_SERVICE_ROLE_KEY

# Apply schema to production
echo "📤 Applying schema to production database..."
npx supabase db reset

# Restore original environment
export NEXT_PUBLIC_SUPABASE_URL=$ORIGINAL_URL
export SUPABASE_SERVICE_ROLE_KEY=$ORIGINAL_KEY

echo "✅ Database sync completed!" 