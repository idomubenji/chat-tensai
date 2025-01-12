import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables from production and local backup
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env.local.backup1' });

async function main() {
  try {
    console.log('🔄 Syncing database schema with production...');

    // Pull the schema from production
    console.log('📥 Pulling current schema from development...');
    execSync(
      'npx supabase db pull',
      { stdio: 'inherit' }
    );

    // Reset and apply migrations to local database
    console.log('🔄 Applying schema to local database...');
    execSync('npx supabase db reset', { stdio: 'inherit' });

    console.log('✅ Database schema sync completed successfully!');
  } catch (error) {
    console.error('❌ Error syncing database schema:', error);
    process.exit(1);
  }
}

main(); 