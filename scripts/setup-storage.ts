import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment-specific .env file
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env.local' });
}

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Environment-specific configurations
const CONFIG = {
  production: {
    fileSizeLimit: 5242880, // 5MB for production
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  development: {
    fileSizeLimit: 10485760, // 10MB for development
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  }
};

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const config = CONFIG[env];

async function setupStorage() {
  try {
    console.log('Setting up storage...');

    // Create avatars bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) throw bucketsError;

    const avatarsBucket = buckets.find(b => b.name === 'avatars');
    
    if (!avatarsBucket) {
      console.log('Creating avatars bucket...');
      const { data, error } = await supabase
        .storage
        .createBucket('avatars', {
          public: true,
          fileSizeLimit: config.fileSizeLimit,
          allowedMimeTypes: config.allowedMimeTypes
        });

      if (error) throw error;
      console.log('Created avatars bucket:', data);
    } else {
      console.log('Avatars bucket already exists');
    }

    // Update bucket to be public
    const { error: updateError } = await supabase
      .storage
      .updateBucket('avatars', {
        public: true,
        fileSizeLimit: config.fileSizeLimit,
        allowedMimeTypes: config.allowedMimeTypes
      });

    if (updateError) throw updateError;
    console.log('Updated avatars bucket settings');

    console.log('Storage setup completed successfully!');
  } catch (error) {
    console.error('Error setting up storage:', error);
    process.exit(1);
  }
}

setupStorage(); 