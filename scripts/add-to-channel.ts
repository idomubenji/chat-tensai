import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

dotenv.config();

// Initialize Supabase client
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
    const userId = 'user_2rHRLTqeMXttalVXfblCIcF47FU';
    const channelId = '576c3705-b8ea-4751-9cea-9003a057fce3';

    console.log('Adding user to channel...');
    console.log('User ID:', userId);
    console.log('Channel ID:', channelId);

    // Check if already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('Error checking membership:', membershipError);
      return;
    }

    if (existingMembership) {
      console.log('User is already a member:', existingMembership);
      return;
    }

    // Add user to channel
    const { data: membership, error: addError } = await supabase
      .from('channel_members')
      .insert([
        {
          channel_id: channelId,
          user_id: userId,
          role_in_channel: 'ADMIN'
        }
      ])
      .select()
      .single();

    if (addError) {
      console.error('Error adding user to channel:', addError);
      return;
    }

    console.log('Successfully added user to channel:', membership);

  } catch (error) {
    console.error('Error in script:', error);
    process.exit(1);
  }
}

main(); 