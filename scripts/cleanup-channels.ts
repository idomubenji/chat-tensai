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
    // Get all channels named 'general' or '#general'
    const { data: channels, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .or('name.eq.general,name.eq.#general');

    if (channelError) throw channelError;
    console.log('Found channels:', channels);

    if (channels.length <= 1) {
      console.log('No duplicate channels found.');
      return;
    }

    // Keep the oldest channel
    const [keepChannel, ...duplicateChannels] = channels.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    console.log('Keeping channel:', keepChannel);
    console.log('Removing channels:', duplicateChannels);

    // Update the name of the kept channel if needed
    if (keepChannel.name !== 'general') {
      const { error: updateError } = await supabase
        .from('channels')
        .update({ name: 'general' })
        .eq('id', keepChannel.id);

      if (updateError) throw updateError;
      console.log('Updated kept channel name to "general"');
    }

    // Move all messages from duplicate channels to the kept channel
    for (const dupChannel of duplicateChannels) {
      const { error: messageUpdateError } = await supabase
        .from('messages')
        .update({ channel_id: keepChannel.id })
        .eq('channel_id', dupChannel.id);

      if (messageUpdateError) throw messageUpdateError;
      console.log(`Moved messages from channel ${dupChannel.id} to ${keepChannel.id}`);

      // Delete the duplicate channel
      const { error: deleteError } = await supabase
        .from('channels')
        .delete()
        .eq('id', dupChannel.id);

      if (deleteError) throw deleteError;
      console.log(`Deleted duplicate channel ${dupChannel.id}`);
    }

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

main(); 