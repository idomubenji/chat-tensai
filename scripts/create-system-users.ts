import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

// Load environment variables from both .env files
dotenv.config({ path: '.env.local' });

// Safety check: Only allow this script to run in development
const isProduction = process.env.NODE_ENV === 'production' || 
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('db.supabase.co');

if (isProduction) {
  console.error('❌ This script is not meant to be run in production!');
  console.error('It should only be used in local/development environments.');
  process.exit(1);
}

console.log('✓ Running in development environment');

// Use local Supabase URL and service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient<Database>(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Add a prefix to ensure these IDs don't conflict with real users
const DEV_PREFIX = 'dev_';

const systemUsers = [
  {
    id: `${DEV_PREFIX}bot`,
    name: 'Chat Genius Bot (Dev)',
    email: 'bot@chat-genius.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${DEV_PREFIX}alice`,
    name: 'Alice (Dev)',
    email: 'alice@chat-genius.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${DEV_PREFIX}bob`,
    name: 'Bob (Dev)',
    email: 'bob@chat-genius.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  }
];

const initialMessages = [
  {
    userId: `${DEV_PREFIX}alice`,
    content: "Hi everyone! Excited to be here! 👋"
  },
  {
    userId: `${DEV_PREFIX}bob`,
    content: "Hey Alice! Great to see you here! How's everyone doing? 😊"
  },
  {
    userId: `${DEV_PREFIX}bot`,
    content: "Welcome Alice and Bob! Feel free to explore the channels and features. Let me know if you need any help! 🤖"
  }
];

async function main() {
  try {
    console.log('Creating development system users...');
    
    // Create system users
    for (const user of systemUsers) {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw checkError;
      }

      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert(user)
          .select()
          .single();

        if (createError) throw createError;
        console.log('Created user:', newUser.name, 'with ID:', newUser.id);
      } else {
        console.log('User already exists:', existingUser.name, 'with ID:', existingUser.id);
      }
    }

    // Check for #general channel
    console.log('\nChecking for #general channel...');
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('name', '#general')
      .single();

    if (channelError && channelError.code !== 'PGRST116') {
      throw channelError;
    }

    let generalChannel = channel;
    if (!generalChannel) {
      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert({
          name: '#general',
          description: 'General discussion channel (Dev)',
          is_private: false,
          created_by_id: `${DEV_PREFIX}bot`
        })
        .select()
        .single();

      if (createError) throw createError;
      generalChannel = newChannel;
      console.log('Created #general channel with ID:', generalChannel.id);
    } else {
      console.log('#general channel already exists with ID:', generalChannel.id);
    }

    // Add all system users to #general
    console.log('\nAdding users to #general...');
    for (const user of systemUsers) {
      const { data: membership, error: membershipError } = await supabase
        .from('channel_members')
        .select()
        .eq('channel_id', generalChannel.id)
        .eq('user_id', user.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      if (!membership) {
        const { error: joinError } = await supabase
          .from('channel_members')
          .insert({
            channel_id: generalChannel.id,
            user_id: user.id,
            role: 'MEMBER'
          });

        if (joinError) throw joinError;
        console.log(`Added ${user.name} to #general`);
      } else {
        console.log(`${user.name} is already in #general`);
      }
    }

    // Check for welcome message
    console.log('\nChecking for welcome message...');
    const { data: welcomeMessage, error: messageError } = await supabase
      .from('messages')
      .select()
      .eq('channel_id', generalChannel.id)
      .eq('user_id', `${DEV_PREFIX}bot`)
      .eq('content', 'Welcome to Chat Genius! 👋 [Development Environment]')
      .single();

    if (messageError && messageError.code !== 'PGRST116') {
      throw messageError;
    }

    if (!welcomeMessage) {
      const { data: newMessage, error: createError } = await supabase
        .from('messages')
        .insert({
          channel_id: generalChannel.id,
          user_id: `${DEV_PREFIX}bot`,
          content: 'Welcome to Chat Genius! 👋 [Development Environment]'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating welcome message:', createError);
        throw createError;
      }
      console.log('Created welcome message with ID:', newMessage.id);
    } else {
      console.log('Welcome message already exists with ID:', welcomeMessage.id);
    }

    // Add initial messages
    console.log('\nAdding initial messages...');
    for (const message of initialMessages) {
      console.log(`\nProcessing message from ${message.userId}:`, message.content);
      
      const { data: existingMessage, error: checkError } = await supabase
        .from('messages')
        .select()
        .eq('channel_id', generalChannel.id)
        .eq('user_id', message.userId)
        .eq('content', message.content)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing message:', checkError);
        throw checkError;
      }

      if (!existingMessage) {
        const { data: newMessage, error: createError } = await supabase
          .from('messages')
          .insert({
            channel_id: generalChannel.id,
            user_id: message.userId,
            content: message.content
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating message:', createError);
          throw createError;
        }
        console.log(`Added message from ${message.userId} with ID:`, newMessage.id);
      } else {
        console.log(`Message from ${message.userId} already exists with ID:`, existingMessage.id);
      }
    }

    // Verify all messages
    console.log('\nVerifying all messages in #general...');
    const { data: allMessages, error: listError } = await supabase
      .from('messages')
      .select(`
        *,
        user:users!messages_user_id_fkey(name)
      `)
      .eq('channel_id', generalChannel.id)
      .order('created_at', { ascending: true });

    if (listError) {
      console.error('Error listing messages:', listError);
      throw listError;
    }

    console.log('\nAll messages in #general:');
    allMessages.forEach(msg => {
      console.log(`- [${msg.user.name}]: ${msg.content}`);
    });

    console.log('\nDevelopment system setup completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 