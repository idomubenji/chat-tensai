import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function POST(request: Request) {
  try {
    const { userId, email, username } = await request.json();
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // First, check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw fetchError;
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      console.log('Creating new user:', { userId, email, username });
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email,
            name: username || email.split('@')[0],
            role: 'USER',
            status: 'ONLINE',
          },
        ]);

      if (insertError) {
        console.error('Error creating user:', insertError);
        throw insertError;
      }
    }

    // Get all channels
    let { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id');

    if (channelsError) {
      console.error('Error fetching channels:', channelsError);
      throw channelsError;
    }

    // If there are no channels, create the general channel
    if (!channels || channels.length === 0) {
      console.log('Creating general channel');
      const { data: generalChannel, error: createChannelError } = await supabase
        .from('channels')
        .insert([
          {
            name: 'general',
            description: 'General discussion',
            is_private: false,
            created_by_id: userId,
          },
        ])
        .select()
        .single();

      if (createChannelError) {
        console.error('Error creating general channel:', createChannelError);
        throw createChannelError;
      }

      channels = [generalChannel];
    }

    // Add user to all channels
    console.log('Adding user to channels:', channels);
    const channelMemberships = channels.map(channel => ({
      user_id: userId,
      channel_id: channel.id,
      role_in_channel: 'MEMBER',
    }));

    const { error: membershipError } = await supabase
      .from('channel_members')
      .upsert(channelMemberships, {
        onConflict: 'user_id,channel_id',
      });

    if (membershipError) {
      console.error('Error adding user to channels:', membershipError);
      throw membershipError;
    }

    console.log('User onboarding completed successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in handleUserOnboarding:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
} 