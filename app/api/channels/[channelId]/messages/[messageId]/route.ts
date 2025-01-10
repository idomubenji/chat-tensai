import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { getAuthUserId } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string; messageId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if message exists and belongs to user
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', params.messageId)
      .eq('channel_id', params.channelId)
      .single();

    if (messageError) {
      return new NextResponse('Message not found', { status: 404 });
    }

    if (message.user_id !== userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete message (cascade will handle reactions and files)
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', params.messageId);

    if (deleteError) throw deleteError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 