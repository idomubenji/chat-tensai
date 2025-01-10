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
    id: `${DEV_PREFIX}bot`,
    name: 'Chat Genius Bot (Dev)',
    email: 'bot@chat-genius.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${DEV_PREFIX}kawaii_neko`,
    name: 'Kawaii Neko-chan',
    email: 'neko@chat-genius.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${DEV_PREFIX}otaku_sensei`,
    name: 'Otaku Sensei',
    email: 'sensei@chat-genius.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${DEV_PREFIX}moe_master`,
    name: 'Moe Master',
    email: 'moe@chat-genius.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  }
];

const animeMessages = [
  {
    userId: `${DEV_PREFIX}bot`,
    content: "Welcome to Chat Genius! 👋 [Development Environment]"
  },
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
    console.log('=== Starting database seeding ===\n');

    // Create users
    console.log('Creating development users...');
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

    // Create general channel
    console.log('\nCreating #general channel...');
    const { data: existingChannel, error: channelCheckError } = await supabase
      .from('channels')
      .select('*')
      .or('name.eq.general,name.eq.#general')
      .single();

    if (channelCheckError && channelCheckError.code !== 'PGRST116') {
      throw channelCheckError;
    }

    let generalChannel = existingChannel;
    if (!generalChannel) {
      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert({
          name: '#general',
          description: 'General discussion channel',
          created_by_id: `${DEV_PREFIX}bot`
        })
        .select()
        .single();

      if (createError) throw createError;
      generalChannel = newChannel;
      console.log('Created #general channel with ID:', generalChannel.id);
    } else {
      // Update the name if needed
      if (generalChannel.name !== '#general') {
        const { error: updateError } = await supabase
          .from('channels')
          .update({ name: '#general' })
          .eq('id', generalChannel.id);
        
        if (updateError) throw updateError;
        console.log('Updated channel name to #general');
      }
      console.log('#general channel already exists with ID:', generalChannel.id);
    }

    // Add all users to general channel
    console.log('\nAdding users to #general...');
    for (const user of animeUsers) {
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
            role_in_channel: user.id === `${DEV_PREFIX}bot` ? 'ADMIN' : 'MEMBER'
          });

        if (joinError) throw joinError;
        console.log(`Added ${user.name} to #general`);
      } else {
        console.log(`${user.name} is already in #general`);
      }
    }

    // Add messages
    console.log('\nAdding messages to #general...');
    for (const message of animeMessages) {
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
        console.log(`Added message from ${message.userId}: ${message.content.slice(0, 30)}...`);
      } else {
        console.log(`Message already exists from ${message.userId}: ${message.content.slice(0, 30)}...`);
      }
    }

    // Verify final state
    console.log('\n=== Verifying database state ===');
    
    // Check users
    const { data: finalUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (usersError) throw usersError;
    console.log(`\nFound ${finalUsers.length} users:`);
    finalUsers.forEach(user => {
      console.log(`- ${user.name} (${user.id})`);
    });

    // Check channels
    const { data: finalChannels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (channelsError) throw channelsError;
    console.log(`\nFound ${finalChannels.length} channels:`);
    finalChannels.forEach(channel => {
      console.log(`- ${channel.name} (${channel.id})`);
    });

    // Check messages
    const { data: finalMessages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        user:users!inner(name),
        channel:channels!inner(name)
      `)
      .order('created_at', { ascending: true });
    
    if (messagesError) throw messagesError;
    console.log(`\nFound ${finalMessages.length} messages:`);
    finalMessages.forEach(msg => {
      console.log(`- [${msg.channel.name}] ${msg.user.name}: ${msg.content.slice(0, 50)}...`);
    });

    console.log('\n=== Database seeding completed successfully! ===');
  } catch (error) {
    console.error('\nError:', error);
    process.exit(1);
  }
}

main(); 