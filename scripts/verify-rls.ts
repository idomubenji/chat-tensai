import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

dotenv.config();

// Initialize Supabase admin client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function main() {
  try {
    console.log('=== Verifying RLS Policies ===\n');

    // Check RLS is enabled on all tables
    console.log('Checking RLS status...');
    const tables = ['users', 'channels', 'messages', 'message_reactions', 'files'];
    for (const table of tables) {
      const { data: enabled, error } = await supabase.rpc('check_rls_enabled', { table_name: table });
      if (error) throw error;
      console.log(`${table}: RLS ${enabled ? 'enabled' : 'disabled'}`);
    }

    // List all policies
    console.log('\nListing all policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*');

    if (policiesError) throw policiesError;
    policies?.forEach(policy => {
      console.log(`\nTable: ${policy.tablename}`);
      console.log(`Policy: ${policy.policyname}`);
      console.log(`Command: ${policy.cmd}`);
      console.log(`Using expression: ${policy.qual}`);
      console.log(`With check: ${policy.with_check}`);
    });

    // Test user creation trigger
    console.log('\nTesting user creation trigger...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test-password-123',
      email_confirm: true
    });

    if (authError) throw authError;
    console.log('Created auth user:', authUser.user);

    // Verify user record was created
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (userError) throw userError;
    console.log('Verified user record:', user);

    // Clean up test user
    await supabase.auth.admin.deleteUser(authUser.user.id);
    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 