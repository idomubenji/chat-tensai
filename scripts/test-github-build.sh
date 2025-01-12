#!/bin/bash
set -e

# Clean start
echo "🧹 Cleaning previous build artifacts..."
rm -rf .next
rm -rf node_modules

# Create test env file
echo "📝 Creating test env files..."
cat > .env << EOL
NEXT_PUBLIC_SUPABASE_URL=https://wzronhnlmkqvgdydzyih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key
SUPABASE_SERVICE_ROLE_KEY=test-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_BUCKET_NAME=test
NODE_ENV=production
PORT=3000
NEXT_DISABLE_ESLINT=1
NEXT_DISABLE_TYPE_CHECKS=1
EOL

cp .env .env.production

# Install dependencies like in CI
echo "📦 Installing dependencies..."
npm ci

echo "🔍 Verifying installations..."
ls -la node_modules/.bin/eslint || echo "❌ eslint not found"
ls -la node_modules/.bin/tsc || echo "❌ typescript not found"

# Try the build
echo "🏗️ Testing build..."
npm run build

echo "✅ Build test complete!" 