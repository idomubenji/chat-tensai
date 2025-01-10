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

    // If user doesn't exist, create them with the provided username
    if (!existingUser) {
      console.log('Creating new user:', { userId, email, username });
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email,
            name: username || email.split('@')[0], // Use username if provided, otherwise use email prefix
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
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id');

    if (channelsError) {
      console.error('Error fetching channels:', channelsError);
      throw channelsError;
    }

    // Add user to all channels
    console.log('Adding user to channels:', channels);
    const channelMemberships = channels.map(channel => ({
      channel_id: channel.id,
      user_id: userId,
      role_in_channel: 'MEMBER'
    }));

    if (channelMemberships.length > 0) {
      const { error: membershipError } = await supabase
        .from('channel_members')
        .upsert(channelMemberships, {
          onConflict: 'user_id,channel_id'
        });

      if (membershipError) {
        console.error('Error adding user to channels:', membershipError);
        throw membershipError;
      }
    }

    // Get the updated user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in onboarding:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during onboarding' },
      { status: 500 }
    );
  }
} 