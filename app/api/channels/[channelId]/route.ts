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

    // Check if user is an admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return new NextResponse('Channel name is required', { status: 400 });
    }

    // Update channel
    const { data: channel, error: updateError } = await supabase
      .from('channels')
      .update({
        name,
        description,
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

    // Check if user is an admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || user.role !== 'ADMIN') {
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