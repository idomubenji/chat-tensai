const { existsSync } = require('fs');
const { join } = require('path');

// Load environment variables
const dotenv = require('dotenv');
if (process.env.NODE_ENV === 'production') {
  console.log('Loading production environment...');
  dotenv.config({ path: '.env.production' });
} else {
  console.log('Loading development environment...');
  dotenv.config({ path: '.env.local' });
}

// Check if we're in production by looking for the standalone server
const isProduction = process.env.NODE_ENV === 'production';
const projectRoot = join(__dirname, '..');
const standaloneServer = join(projectRoot, '.next/standalone/server.js');
const hasStandaloneServer = existsSync(standaloneServer);

console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  isProduction,
  hasStandaloneServer,
  standaloneServerPath: standaloneServer,
  projectRoot,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

if (isProduction && hasStandaloneServer) {
  // In production, use the standalone server
  console.log('Starting production server from:', standaloneServer);
  process.chdir(join(projectRoot, '.next/standalone'));
  require(standaloneServer);
} else {
  // In development or if standalone server is not found, use next start
  console.log('Starting development server...');
  console.log('Note: For production, make sure to run `next build` first');
  process.chdir(projectRoot);
  require('next/dist/cli/next-start').default();
} 