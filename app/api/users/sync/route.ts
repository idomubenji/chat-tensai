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

    // Get general channel
    const { data: generalChannel, error: channelError } = await supabase
      .from('channels')
      .select('id')
      .or('name.eq.general,name.eq.#general')
      .single();

    if (channelError) {
      console.error('Error fetching general channel:', channelError);
      return NextResponse.json({ error: 'Failed to fetch general channel' }, { status: 500 });
    }

    // Add user to general channel
    const { error: memberError } = await supabase
      .from('channel_members')
      .upsert({
        channel_id: generalChannel.id,
        user_id: userId,
        role_in_channel: 'MEMBER'
      }, {
        onConflict: 'user_id,channel_id'
      });

    if (memberError) {
      console.error('Error adding user to general channel:', memberError);
      return NextResponse.json({ error: 'Failed to add user to general channel' }, { status: 500 });
    }

    console.log('Added user to general channel:', generalChannel.id);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 