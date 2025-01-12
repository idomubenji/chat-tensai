#!/bin/bash
set -e

echo "🧪 Testing deployment process locally..."

# Create test directory
TEST_DIR="deploy-test"
echo "📁 Creating test directory: $TEST_DIR"
rm -rf $TEST_DIR
mkdir -p $TEST_DIR

# Run prepare-deploy to create the package
echo "📦 Running prepare-deploy..."
./scripts/prepare-deploy.sh

# Extract the package in test directory
echo "📂 Extracting deployment package..."
tar -xzf deploy.tar.gz -C $TEST_DIR

# Create necessary directories (from nginx-deployment-fix.md)
echo "📁 Creating required directories..."
cd $TEST_DIR
mkdir -p .next/standalone/.next/static
mkdir -p .next/standalone/public

# Test the build process
echo "🏗️ Testing build process..."
export NODE_ENV=production
npm install --omit=dev --verbose
npm install --save-dev typescript@latest @types/node@latest eslint@latest @typescript-eslint/parser@latest @typescript-eslint/eslint-plugin@latest --verbose

echo "🔨 Building application..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Test cleanup of .next directory
echo "🧹 Testing .next cleanup..."
if [ -d ".next/standalone/.next/cache" ]; then
  echo "Testing removal of .next cache..."
  sudo rm -rf .next/standalone/.next/cache
  if [ $? -ne 0 ]; then
    echo "❌ Warning: Permission issues detected with .next cache cleanup"
    echo "This might cause issues in production"
    exit 1
  fi
fi

echo "✅ Deployment test completed successfully!"
echo "You can inspect the test deployment in the '$TEST_DIR' directory"

# Cleanup
cd ..
echo "🧹 Cleaning up..."
rm -rf $TEST_DIR
rm -f deploy.tar.gz

echo "✨ All done! If no errors occurred, the deployment should work in production." 