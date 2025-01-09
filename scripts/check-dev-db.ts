import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

dotenv.config();

// Initialize Supabase client for development
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function main() {
  try {
    console.log('\nChecking development database state...');
    
    // Check channels
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*');

    if (channelsError) {
      console.error('Error fetching channels:', channelsError);
      return;
    }

    console.log('\nChannels:', channels);

    // Check messages in the general channel
    const generalChannel = channels?.find(c => c.name === 'general');
    if (generalChannel) {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', generalChannel.id);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      console.log('\nMessages in general channel:', messages);
    }

    // Check channel members
    const { data: members, error: membersError } = await supabase
      .from('channel_members')
      .select('*');

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return;
    }

    console.log('\nChannel members:', members);

  } catch (error) {
    console.error('Error checking database state:', error);
    process.exit(1);
  }
}

main(); 