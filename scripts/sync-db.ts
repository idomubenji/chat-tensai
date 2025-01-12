import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables from production and local backup
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env.local.backup1' });

async function main() {
  try {
    console.log('🔄 Syncing database schema...');

    // Reset and apply migrations to local database
    console.log('🔄 Applying migrations to local database...');
    execSync('npx supabase db reset', { stdio: 'inherit' });

    console.log('✅ Database schema sync completed successfully!');
  } catch (error) {
    console.error('❌ Error syncing database schema:', error);
    process.exit(1);
  }
}

main(); 