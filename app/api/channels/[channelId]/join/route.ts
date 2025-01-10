import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { getAuthUserId } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if channel exists and is not private
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('is_private')
      .eq('id', params.channelId)
      .single();

    if (channelError) {
      return new NextResponse('Channel not found', { status: 404 });
    }

    if (channel.is_private) {
      return new NextResponse('Cannot join private channel directly', { status: 403 });
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from('channel_members')
      .select()
      .eq('channel_id', params.channelId)
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      return new NextResponse('Already a member', { status: 400 });
    }

    // Add user as member
    const { data: membership, error: createError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: params.channelId,
        user_id: userId,
        role_in_channel: 'MEMBER',
      })
      .select('*, channel:channels(*)')
      .single();

    if (createError) throw createError;

    return NextResponse.json(membership);
  } catch (error) {
    console.error('[CHANNEL_JOIN]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 