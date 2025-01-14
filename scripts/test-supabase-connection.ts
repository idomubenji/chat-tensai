import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

// Debug environment variables
console.log('\nEnvironment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Loaded from:', '.env.development');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
// Only show first and last 4 chars of keys for security
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 
  `${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 4)}...${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-4)}` : 'not set');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
  `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 4)}...${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-4)}` : 'not set');

// Try different connection configurations
async function testConnections() {
  console.log('\nTesting different connection configurations:');

  // Test 1: Basic connection with service role
  console.log('\n1. Testing with service role key:');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    const { data: serviceRoleData, error: serviceRoleError } = await supabaseAdmin
      .from('users')
      .select('count')
      .single();
    console.log('Service role result:', serviceRoleError || serviceRoleData);
  } catch (e) {
    console.log('Service role error:', e);
  }

  // Test 2: Connection with anon key
  console.log('\n2. Testing with anon key:');
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('users')
      .select('count')
      .single();
    console.log('Anon key result:', anonError || anonData);
  } catch (e) {
    console.log('Anon key error:', e);
  }

  // Test 3: Raw HTTP request to verify URL is accessible
  console.log('\n3. Testing raw HTTP connection to URL:');
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    console.log('HTTP Status:', response.status);
    console.log('HTTP OK:', response.ok);
  } catch (e) {
    console.log('HTTP error:', e);
  }
}

testConnections(); 