import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Safety check: Only allow this script to run in development
const isProduction = process.env.NODE_ENV === 'production' || 
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('db.supabase.co');

if (isProduction) {
  console.error('❌ This script is not meant to be run in production!');
  console.error('It should only be used in local/development environments.');
  process.exit(1);
}

// Use local Supabase URL and service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

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

const animeUsers = [
  {
    id: `${DEV_PREFIX}kawaii_neko`,
    name: 'Kawaii Neko-chan',
    email: 'neko@chat-tensai.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${DEV_PREFIX}otaku_sensei`,
    name: 'Otaku Sensei',
    email: 'sensei@chat-tensai.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${DEV_PREFIX}moe_master`,
    name: 'Moe Master',
    email: 'moe@chat-tensai.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  }
];

const animeMessages = [
  {
    userId: `${DEV_PREFIX}kawaii_neko`,
    content: "Hey everyone! Who else thinks anime girls are just the cutest? (＾▽＾)♡"
  },
  {
    userId: `${DEV_PREFIX}otaku_sensei`,
    content: "Absolutely! The way they say 'Kyaaaa~' when they're embarrassed is just too precious! 🌸"
  },
  {
    userId: `${DEV_PREFIX}moe_master`,
    content: "Don't forget about their adorable cat ears and tails! Nekomimi supremacy! 😻"
  },
  {
    userId: `${DEV_PREFIX}kawaii_neko`,
    content: "Yessss! And when they do that thing where they put their hands on their cheeks and blush... my heart can't take it! (｡♡‿♡｡)"
  },
  {
    userId: `${DEV_PREFIX}otaku_sensei`,
    content: "The best is when they're trying to act tough but they're actually super shy inside... gap moe is life! 💕"
  },
  {
    userId: `${DEV_PREFIX}moe_master`,
    content: "Speaking of cute anime girls, have you seen the new season of 'My Totally Adorable Little Sister Can't Be This Kawaii'? The animation is so fluffy! ✨"
  }
];

async function main() {
  try {
    console.log('Creating anime discussion users...');
    
    // Create anime users
    for (const user of animeUsers) {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
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

    // Get #general channel
    console.log('\nFetching #general channel...');
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('name', 'general')
      .single();

    if (channelError) {
      throw channelError;
    }

    // Add anime messages
    console.log('\nAdding anime discussion messages...');
    for (const message of animeMessages) {
      console.log(`\nProcessing message from ${message.userId}:`, message.content);
      
      const { data: existingMessage, error: checkError } = await supabase
        .from('messages')
        .select()
        .eq('channel_id', channel.id)
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
            channel_id: channel.id,
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
      .eq('channel_id', channel.id)
      .order('created_at', { ascending: true });

    if (listError) {
      console.error('Error listing messages:', listError);
      throw listError;
    }

    console.log('\nAll messages in #general:');
    allMessages.forEach(msg => {
      console.log(`- [${msg.user.name}]: ${msg.content}`);
    });

    console.log('\nAnime discussion setup completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 