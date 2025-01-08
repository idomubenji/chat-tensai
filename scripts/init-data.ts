import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

dotenv.config();

// Initialize Supabase admin client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyData() {
  console.log('\n=== Verifying Database State ===\n');

  // Check users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
  } else {
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- User ${user.id}: ${user.name} (${user.email})`);
    });
  }

  // Check channels
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*');
  
  if (channelsError) {
    console.error('Error fetching channels:', channelsError);
  } else {
    console.log(`\nFound ${channels.length} channels:`);
    channels.forEach(channel => {
      console.log(`- Channel ${channel.id}: ${channel.name} (created by ${channel.created_by_id})`);
    });
  }

  // Check channel members
  const { data: members, error: membersError } = await supabase
    .from('channel_members')
    .select(`
      *,
      channel:channels(name),
      user:users(name)
    `);
  
  if (membersError) {
    console.error('Error fetching channel members:', membersError);
  } else {
    console.log(`\nFound ${members.length} channel members:`);
    members.forEach(member => {
      console.log(`- Member: ${member.user?.name} in ${member.channel?.name} (role: ${member.role})`);
    });
  }

  // Check messages
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      *,
      channel:channels(name),
      author:users!messages_user_id_fkey(name)
    `);
  
  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
  } else {
    console.log(`\nFound ${messages.length} messages:`);
    messages.forEach(message => {
      console.log(`- Message in ${message.channel?.name} by ${message.author?.name}: ${message.content}`);
    });
  }
}

async function main() {
  try {
    // Get the first user (assuming they exist)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) throw userError;
    if (!users || users.length === 0) {
      console.log('No users found. Please sign in first to create a user.');
      return;
    }

    const user = users[0];
    console.log('Found user:', user);

    // First check if general channel exists
    const { data: existingChannel, error: findError } = await supabase
      .from('channels')
      .select('*')
      .eq('name', 'general')
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw findError;
    }

    let channel = existingChannel;

    // Create channel only if it doesn't exist
    if (!channel) {
      const { data: newChannel, error: channelError } = await supabase
        .from('channels')
        .insert({
          name: 'general',
          description: 'General discussion',
          is_private: false,
          created_by_id: user.id
        })
        .select()
        .single();

      if (channelError) throw channelError;
      channel = newChannel;
      console.log('Created new channel:', channel);
    } else {
      console.log('Found existing channel:', channel);
    }

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', channel.id)
      .eq('user_id', user.id)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      throw memberCheckError;
    }

    if (!existingMember) {
      // Add user as channel member if not already
      const { data: member, error: memberError } = await supabase
        .from('channel_members')
        .insert({
          channel_id: channel.id,
          user_id: user.id,
          role_in_channel: 'ADMIN'
        })
        .select()
        .single();

      if (memberError) throw memberError;
      console.log('Added user to channel:', member);
    } else {
      console.log('User is already a member:', existingMember);
    }

    // Check if welcome message exists
    const { data: existingMessage, error: messageCheckError } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channel.id)
      .eq('content', 'Welcome to Chat Genius! 👋')
      .single();

    if (messageCheckError && messageCheckError.code !== 'PGRST116') {
      throw messageCheckError;
    }

    if (!existingMessage) {
      // Create welcome message only if it doesn't exist
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          channel_id: channel.id,
          user_id: user.id,
          content: 'Welcome to Chat Genius! 👋'
        })
        .select()
        .single();

      if (messageError) throw messageError;
      console.log('Created welcome message:', message);
    } else {
      console.log('Welcome message already exists:', existingMessage);
    }

    console.log('\nInitial setup complete! Verifying final state...\n');
    await verifyData();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 