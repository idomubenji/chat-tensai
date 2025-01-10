import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { getAuthUserId } from '@/lib/auth';

export async function POST() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get user data from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all channels
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id');

    if (channelsError) {
      console.error('Error fetching channels:', channelsError);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    console.log('Adding user to channels:', channels);

    // Add user to all channels if they're not already a member
    for (const channel of channels) {
      const { error: memberError } = await supabase
        .from('channel_members')
        .upsert({
          channel_id: channel.id,
          user_id: userId,
          role_in_channel: 'MEMBER'
        }, {
          onConflict: 'user_id,channel_id'
        });

      if (memberError) {
        console.error(`Error adding user to channel ${channel.id}:`, memberError);
      } else {
        console.log(`Added user to channel ${channel.id}`);
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 