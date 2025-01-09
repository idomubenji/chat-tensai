import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

dotenv.config();

// Initialize Supabase client
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

    // Check for existing general channel
    const { data: existingChannels, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .or('name.eq.general,name.eq.#general');

    if (channelError) {
      console.error('Error checking for existing channel:', channelError);
      return;
    }

    let generalChannelId = '';

    if (existingChannels.length > 0) {
      // Use the existing channel
      const generalChannel = existingChannels[0];
      generalChannelId = generalChannel.id;
      
      // Update the name if needed
      if (generalChannel.name !== 'general') {
        const { error: updateError } = await supabase
          .from('channels')
          .update({ name: 'general' })
          .eq('id', generalChannelId);
        
        if (updateError) {
          console.error('Error updating channel name:', updateError);
          return;
        }
      }
    } else {
      // Create new general channel
      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert([
          {
            name: 'general',
            description: 'General discussion',
            created_by_id: user.id,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating channel:', createError);
        return;
      }

      generalChannelId = newChannel.id;
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', generalChannelId)
      .eq('user_id', user.id)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('Error checking membership:', membershipError);
      return;
    }

    // Add user to channel if not already a member
    if (!existingMembership) {
      const { error: addError } = await supabase
        .from('channel_members')
        .insert([
          {
            channel_id: generalChannelId,
            user_id: user.id,
            role_in_channel: 'ADMIN',
          },
        ]);

      if (addError) {
        console.error('Error adding user to channel:', addError);
        return;
      }
    }

    console.log('General channel ID:', generalChannelId);

    // Check for welcome message
    console.log('\nChecking for welcome message...');
    const { data: existingMessage, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', generalChannelId)
      .eq('content', 'Welcome to Chat Genius! 👋')
      .single();

    if (messageError && messageError.code !== 'PGRST116') throw messageError;

    if (!existingMessage) {
      console.log('Adding welcome message...');
      const { data: message, error: welcomeError } = await supabase
        .from('messages')
        .insert({
          content: 'Welcome to Chat Genius! 👋',
          channel_id: generalChannelId,
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