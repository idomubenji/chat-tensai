import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function main() {
  try {
    // Create a test user with timestamp to ensure uniqueness
    const timestamp = new Date().getTime();
    const email = `test${timestamp}@example.com`;
    const password = 'testpassword123';

    // First try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!signInError) {
      console.log('User already exists and can sign in');
      console.log('Email:', email);
      console.log('Password:', password);
      process.exit(0);
    }

    // Create new user
    console.log('Creating test user...');
    const { data: authUser, error: createError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (createError) throw createError;
    if (!authUser.user) throw new Error('No user returned from signUp');

    console.log('Created auth user:', authUser.user.id);

    // Create the user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: email,
        name: 'Test User',
        status: 'ONLINE',
        role: 'USER'
      })
      .select()
      .single();

    if (profileError) throw profileError;
    console.log('Created user profile:', userProfile);

    console.log('\nTest user credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 