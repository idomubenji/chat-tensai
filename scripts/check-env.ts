import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
  'NODE_ENV',
  'PORT'
];

function loadEnvFile(envFile: string) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (!fs.existsSync(envPath)) {
    console.error(`❌ ${envFile} not found`);
    return false;
  }
  
  const result = config({ path: envPath });
  if (result.error) {
    console.error(`❌ Error loading ${envFile}:`, result.error);
    return false;
  }
  
  return true;
}

function checkEnvVars(envFile: string) {
  console.log(`\nChecking ${envFile}...`);
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length === 0) {
    console.log(`✅ All required environment variables present in ${envFile}`);
    return true;
  }
  
  console.error(`❌ Missing required environment variables in ${envFile}:`);
  missing.forEach(envVar => console.error(`   - ${envVar}`));
  return false;
}

async function main() {
  const envFiles = ['.env.development', '.env.production'];
  let success = true;
  
  for (const envFile of envFiles) {
    if (loadEnvFile(envFile)) {
      success = checkEnvVars(envFile) && success;
    } else {
      success = false;
    }
  }
  
  if (!success) {
    console.error('\n❌ Environment check failed');
    process.exit(1);
  }
  
  console.log('\n✅ All environment checks passed');
}

main().catch(error => {
  console.error('Error running environment checks:', error);
  process.exit(1);
}); 