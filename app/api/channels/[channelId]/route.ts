import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { getAuthUserId } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if user is a member of the channel
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', params.channelId)
      .eq('user_id', userId)
      .single();

    if (membershipError) {
      return new NextResponse('Channel not found', { status: 404 });
    }

    if (membership.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { name, description, is_private } = body;

    if (!name?.trim()) {
      return new NextResponse('Channel name is required', { status: 400 });
    }

    // Update channel
    const { data: channel, error: updateError } = await supabase
      .from('channels')
      .update({
        name,
        description,
        is_private,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.channelId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(channel);
  } catch (error) {
    console.error('Error updating channel:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if user is an admin of the channel
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', params.channelId)
      .eq('user_id', userId)
      .single();

    if (membershipError) {
      return new NextResponse('Channel not found', { status: 404 });
    }

    if (membership.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete channel (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('channels')
      .delete()
      .eq('id', params.channelId);

    if (deleteError) throw deleteError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting channel:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 