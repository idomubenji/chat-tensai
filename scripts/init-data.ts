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
    // Get the first user (you)
    console.log('Fetching users...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');

    if (userError) throw userError;
    console.log('All users:', users);

    if (!users || users.length === 0) {
      throw new Error('No users found');
    }

    const user = users[0];
    console.log('Selected user:', user);

    // Check for #general channel
    console.log('\nChecking for #general channel...');
    const { data: existingChannel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('name', '#general')
      .single();

    if (channelError && channelError.code !== 'PGRST116') throw channelError;

    let channel = existingChannel;
    if (!channel) {
      console.log('Creating #general channel...');
      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert({
          name: '#general',
          description: 'General discussion channel',
          is_private: false,
          created_by_id: user.id
        })
        .select()
        .single();

      if (createError) throw createError;
      channel = newChannel;
      console.log('Created #general channel:', channel);
    } else {
      console.log('Found existing #general channel:', channel);
    }

    // Check if user is already a member
    console.log('\nChecking channel membership...');
    const { data: existingMembership, error: membershipError } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', channel.id)
      .eq('user_id', user.id)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') throw membershipError;

    if (!existingMembership) {
      console.log('Adding user to #general...');
      const { data: membership, error: addError } = await supabase
        .from('channel_members')
        .insert({
          channel_id: channel.id,
          user_id: user.id,
          role_in_channel: 'MEMBER'
        })
        .select()
        .single();

      if (addError) throw addError;
      console.log('Added user to #general:', membership);
    } else {
      console.log('User is already a member:', existingMembership);
    }

    // Check for welcome message
    console.log('\nChecking for welcome message...');
    const { data: existingMessage, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channel.id)
      .eq('content', 'Welcome to Chat Genius! 👋')
      .single();

    if (messageError && messageError.code !== 'PGRST116') throw messageError;

    if (!existingMessage) {
      console.log('Adding welcome message...');
      const { data: message, error: welcomeError } = await supabase
        .from('messages')
        .insert({
          content: 'Welcome to Chat Genius! 👋',
          channel_id: channel.id,
          user_id: user.id
        })
        .select()
        .single();

      if (welcomeError) throw welcomeError;
      console.log('Added welcome message:', message);
    } else {
      console.log('Welcome message already exists:', existingMessage);
    }

    console.log('\nInitialization completed successfully!');
  } catch (error) {
    console.error('Error in initialization:', error);
    process.exit(1);
  }
}

main(); 