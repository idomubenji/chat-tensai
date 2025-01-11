import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing required environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey);
    process.exit(1);
  }

  console.log('Testing Supabase connection with:');
  console.log('URL:', supabaseUrl);
  console.log('Service Key Present:', !!supabaseServiceRoleKey);

  try {
    // Test direct HTTP connection first
    console.log('\n1. Testing direct HTTP connection...');
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
    }

    const httpData = await response.json();
    console.log('Direct HTTP connection successful:', httpData);

    // Test Supabase client connection
    console.log('\n2. Testing Supabase client connection...');
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: fetch as any,
      },
    });

    const { data, error } = await supabase.from('users').select('count').single();

    if (error) {
      throw error;
    }

    console.log('Supabase client connection successful:', data);
    process.exit(0);
  } catch (error) {
    console.error('\nConnection test failed:');
    if (error instanceof Error) {
      console.error('Error type:', error.constructor.name);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

testSupabaseConnection(); 