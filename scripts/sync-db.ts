import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables from both .env files
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log('Syncing database schema with production...');

    // Use Supabase CLI to pull the schema
    console.log('Pulling schema from production using Supabase CLI...');
    execSync(
      'npx supabase db remote commit',
      { stdio: 'inherit' }
    );

    // Reset and apply migrations to local database
    console.log('Applying schema to local database...');
    execSync('npx supabase db reset', { stdio: 'inherit' });

    console.log('Database schema sync completed successfully!');
  } catch (error) {
    console.error('Error syncing database schema:', error);
    process.exit(1);
  }
}

main(); 