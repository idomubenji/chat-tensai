import { auth } from '@clerk/nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Fetching channels for user:', userId);

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // First verify the user exists in our database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return new NextResponse('User not found', { status: 404 });
    }

    // Get all channels the user is a member of
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*, channel_members!inner(user_id)')
      .eq('channel_members.user_id', userId);

    if (channelsError) {
      console.error('Error fetching channels:', channelsError);
      throw channelsError;
    }

    console.log('Found channels:', channels);
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error in GET /api/channels:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if user exists and is an admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) throw userError;
    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { name, description = '', is_private = false } = body;

    if (!name?.trim()) {
      return new NextResponse('Channel name is required', { status: 400 });
    }

    // Create channel and add creator as admin member
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert({
        name,
        description,
        is_private,
        created_by_id: userId
      })
      .select()
      .single();

    if (channelError) throw channelError;

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: userId,
        role: 'ADMIN'
      });

    if (memberError) throw memberError;

    return NextResponse.json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 