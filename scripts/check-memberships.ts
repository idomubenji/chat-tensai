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
    // Check channel_members table
    console.log('\nChecking channel_members table...');
    const { data: memberships, error: membershipError } = await supabase
      .from('channel_members')
      .select('*');

    if (membershipError) {
      throw membershipError;
    }

    console.log('All channel memberships:', memberships);

    // Check channels table
    console.log('\nChecking channels table...');
    const { data: channels, error: channelError } = await supabase
      .from('channels')
      .select('*');

    if (channelError) {
      throw channelError;
    }

    console.log('All channels:', channels);

    // Check RLS is enabled
    console.log('\nChecking RLS status...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_enabled', {
        table_name: 'channel_members'
      });

    if (rlsError) {
      console.log('Error checking RLS:', rlsError);
    } else {
      console.log('RLS status:', rlsStatus);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 