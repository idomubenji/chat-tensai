#!/bin/bash

echo "Preparing deployment package..."

# Clean up any existing deployment directory
rm -rf deploy
rm -f deploy.tar.gz

# Create fresh deployment directory
mkdir -p deploy

# Copy all source code directories
echo "Copying source files..."
cp -r app deploy/
cp -r components deploy/
cp -r hooks deploy/
cp -r lib deploy/
cp -r public deploy/
cp -r types deploy/
cp -r styles deploy/ 2>/dev/null || true
cp -r utils deploy/ 2>/dev/null || true
cp -r supabase deploy/

# Copy all configuration files
echo "Copying configuration files..."
cp package.json deploy/
cp package-lock.json deploy/
cp .env.production deploy/.env
cp next.config.mjs deploy/
cp tsconfig.json deploy/
cp server.js deploy/
cp ecosystem.config.js deploy/
cp middleware.ts deploy/
cp .eslintrc.json deploy/
cp postcss.config.mjs deploy/
cp tailwind.config.ts deploy/
cp next-env.d.ts deploy/
cp components.json deploy/

# Create logs directory
mkdir -p deploy/logs

# Create the start script
echo "Creating start script..."
cat > deploy/start.sh << 'EOF'
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

# Load environment variables
echo "Loading environment variables..."
set -a
source .env
set +a

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
pm2 delete chat-tensai 2>/dev/null || true

# Clean up any existing .next cache with sudo
echo "Cleaning up .next cache..."
if [ -d ".next" ]; then
  sudo rm -rf .next
fi

echo "Ensuring general channel exists..."
NODE_ENV=production npx ts-node scripts/ensure-general-channel.ts

echo "Starting server..."
pm2 start ecosystem.config.js --env production

echo "Saving PM2 process list..."
pm2 save

echo "Setup complete! Application should be running."
echo "Check status with: pm2 list"
echo "View logs with: pm2 logs chat-tensai"

# Print current process status
echo "Current PM2 processes:"
pm2 list

# Print recent logs
echo "Recent application logs:"
pm2 logs chat-tensai --lines 20 || true
EOF

chmod +x deploy/start.sh

# Create tar file (with no macOS attributes)
echo "Creating deployment archive..."
COPYFILE_DISABLE=1 tar --exclude='._*' --exclude='.DS_Store' --exclude='node_modules' -czf deploy.tar.gz -C deploy .

echo "Deployment package created: deploy.tar.gz"
echo ""
echo "To deploy to EC2:"
echo "1. Copy the package to EC2:"
echo "   scp -i ~/.ssh/chat-tensai-ec2.pem deploy.tar.gz ec2-user@44.200.83.77:~"
echo ""
echo "2. SSH into EC2:"
echo "   ssh -i ~/.ssh/chat-tensai-ec2.pem ec2-user@44.200.83.77"
echo ""
echo "3. Extract and deploy:"
echo "   cd ~"
echo "   rm -rf chat-tensai"
echo "   mkdir chat-tensai"
echo "   cd chat-tensai"
echo "   tar -xzf ../deploy.tar.gz"
echo "   ./start.sh" 