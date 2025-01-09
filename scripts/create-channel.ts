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

    console.log('Creating general channel...');
    console.log('Channel ID:', channelId);
    console.log('Created by user:', userId);

    // Create the channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert([
        {
          id: channelId,
          name: 'general',
          description: 'General discussion',
          created_by_id: userId
        }
      ])
      .select()
      .single();

    if (channelError) {
      console.error('Error creating channel:', channelError);
      return;
    }

    console.log('Successfully created channel:', channel);

    // Add user as member
    const { data: membership, error: membershipError } = await supabase
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

    if (membershipError) {
      console.error('Error adding user to channel:', membershipError);
      return;
    }

    console.log('Successfully added user to channel:', membership);

    // Add welcome message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          content: 'Welcome to Chat Genius! 👋',
          channel_id: channelId,
          user_id: userId
        }
      ])
      .select()
      .single();

    if (messageError) {
      console.error('Error adding welcome message:', messageError);
      return;
    }

    console.log('Successfully added welcome message:', message);

  } catch (error) {
    console.error('Error in script:', error);
    process.exit(1);
  }
}

main(); 