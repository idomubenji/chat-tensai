import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Load environment variables
config();

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

// Extract project ref from URL
const projectRef = NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
if (!projectRef) {
  throw new Error('Invalid SUPABASE_URL format');
}

// Create admin client
const supabase = createClient<Database>(
  `https://${projectRef}.supabase.co`,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

async function seedTestData() {
  try {
    console.log('Starting to seed test data...');

    // Create test users
    console.log('Creating test users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          email: 'admin@example.com',
          name: 'Admin User',
          avatar_url: 'https://api.dicebear.com/7.x/avatars/svg?seed=admin',
          status: 'ONLINE',
          role: 'ADMIN'
        },
        {
          email: 'john@example.com',
          name: 'John Doe',
          avatar_url: 'https://api.dicebear.com/7.x/avatars/svg?seed=john',
          status: 'ONLINE',
          role: 'USER'
        },
        {
          email: 'jane@example.com',
          name: 'Jane Smith',
          avatar_url: 'https://api.dicebear.com/7.x/avatars/svg?seed=jane',
          status: 'OFFLINE',
          role: 'USER'
        }
      ])
      .select();

    if (usersError) throw usersError;
    console.log('Created users:', users.map(u => u.name));

    // Create test channels
    console.log('Creating test channels...');
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .insert([
        {
          name: 'general',
          description: 'General discussion channel',
          is_private: false,
          created_by_id: users[0].id // Admin creates the channels
        },
        {
          name: 'random',
          description: 'Random discussions and fun stuff',
          is_private: false,
          created_by_id: users[0].id
        },
        {
          name: 'private-team',
          description: 'Private team discussions',
          is_private: true,
          created_by_id: users[0].id
        }
      ])
      .select();

    if (channelsError) throw channelsError;
    console.log('Created channels:', channels.map(c => c.name));

    // Add users to channels
    console.log('Adding channel members...');
    const channelMembers = [];
    for (const channel of channels) {
      for (const user of users) {
        channelMembers.push({
          channel_id: channel.id,
          user_id: user.id,
          role_in_channel: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
        });
      }
    }

    const { error: membersError } = await supabase
      .from('channel_members')
      .insert(channelMembers);

    if (membersError) throw membersError;
    console.log('Added users to channels');

    // Create some test messages
    console.log('Creating test messages...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .insert([
        {
          content: 'Welcome to the general channel! 👋',
          channel_id: channels[0].id,
          user_id: users[0].id
        },
        {
          content: 'Thanks! Happy to be here',
          channel_id: channels[0].id,
          user_id: users[1].id
        },
        {
          content: 'Hello everyone!',
          channel_id: channels[0].id,
          user_id: users[2].id
        },
        {
          content: 'This is a private team channel',
          channel_id: channels[2].id,
          user_id: users[0].id
        }
      ])
      .select();

    if (messagesError) throw messagesError;
    console.log('Created messages');

    // Add some reactions
    console.log('Adding message reactions...');
    const { error: reactionsError } = await supabase
      .from('message_reactions')
      .insert([
        {
          message_id: messages[0].id,
          user_id: users[1].id,
          emoji: '👋'
        },
        {
          message_id: messages[0].id,
          user_id: users[2].id,
          emoji: '❤️'
        }
      ]);

    if (reactionsError) throw reactionsError;
    console.log('Added message reactions');

    console.log('Test data seeded successfully!');
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();
