import { auth } from '@clerk/nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function PATCH(
  req: Request,
  { params }: { params: { channelId: string; userId: string } }
) {
  try {
    const { userId: currentUserId } = auth();
    if (!currentUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if current user is an admin of the channel
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', params.channelId)
      .eq('user_id', currentUserId)
      .single();

    if (membershipError) {
      return new NextResponse('Channel not found', { status: 404 });
    }

    if (membership.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { role } = body;

    if (!role || !['MEMBER', 'ADMIN'].includes(role)) {
      return new NextResponse('Invalid role', { status: 400 });
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('channel_members')
      .update({ role })
      .eq('channel_id', params.channelId)
      .eq('user_id', params.userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating channel member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string; userId: string } }
) {
  try {
    const { userId: currentUserId } = auth();
    if (!currentUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if current user is an admin or the member being removed
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', params.channelId)
      .eq('user_id', currentUserId)
      .single();

    if (membershipError && currentUserId !== params.userId) {
      return new NextResponse('Channel not found', { status: 404 });
    }

    if (membership?.role !== 'ADMIN' && currentUserId !== params.userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if target user is the last admin
    if (membership?.role === 'ADMIN' && currentUserId === params.userId) {
      const { count, error: countError } = await supabase
        .from('channel_members')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', params.channelId)
        .eq('role', 'ADMIN');

      if (countError) throw countError;
      if (count === 1) {
        return new NextResponse('Cannot remove last admin', { status: 400 });
      }
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', params.channelId)
      .eq('user_id', params.userId);

    if (deleteError) throw deleteError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing channel member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 