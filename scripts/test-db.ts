import { config } from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables first
config();

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import {
  getUser,
  getChannel,
  getChannelMessages,
  createMessage,
  addReaction,
  removeReaction
} from '../lib/db';

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

// Create admin client
const supabase = createClient<Database>(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testDatabaseOperations() {
  try {
    console.log('Testing database operations...\n');

    // 1. Get users
    console.log('1. Testing getUser...');
    const { data: users } = await supabase.from('users').select('*').limit(1);
    if (!users || users.length === 0) throw new Error('No users found');
    const testUser = users[0];
    
    const user = await getUser(testUser.id);
    console.log('Found user:', user?.name);
    console.log('---\n');

    // 2. Get channels
    console.log('2. Testing getChannel...');
    const { data: channels } = await supabase.from('channels').select('*').limit(1);
    if (!channels || channels.length === 0) throw new Error('No channels found');
    const testChannel = channels[0];

    const channel = await getChannel(testChannel.id);
    console.log('Found channel:', channel?.name);
    console.log('---\n');

    // 3. Get channel messages
    console.log('3. Testing getChannelMessages...');
    const messages = await getChannelMessages(testChannel.id);
    console.log(`Found ${messages?.length} messages in channel`);
    console.log('Sample message:', messages?.[0]?.content);
    console.log('---\n');

    // 4. Create a new message
    console.log('5. Testing createMessage...');
    const newMessage = await createMessage({
      id: randomUUID(),
      content: 'This is a test message',
      channel_id: testChannel.id,
      user_id: testUser.id,
      parent_id: null
    });
    console.log('Created message:', newMessage?.content);
    console.log('---\n');

    // 5. Add and remove a reaction
    if (newMessage) {
      console.log('6. Testing reactions...');
      await addReaction({
        message_id: newMessage.id,
        user_id: testUser.id,
        emoji: '👍'
      });
      console.log('Added reaction');

      await removeReaction(newMessage.id, testUser.id, '👍');
      console.log('Removed reaction');
      console.log('---\n');
    }

    console.log('All tests completed successfully! 🎉');
  } catch (error) {
    console.error('Error during testing:', error);
    process.exit(1);
  }
}

testDatabaseOperations(); 