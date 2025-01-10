import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { getAuthUserId } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { channelId: string; messageId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get reactions for the message
    const { data: reactions, error: reactionsError } = await supabase
      .from('message_reactions')
      .select(`
        *,
        user:users(*)
      `)
      .eq('message_id', params.messageId);

    if (reactionsError) throw reactionsError;

    return NextResponse.json(reactions);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { channelId: string; messageId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    const body = await req.json();
    const { emoji } = body;

    if (!emoji?.trim()) {
      return new NextResponse('Emoji is required', { status: 400 });
    }

    // Check if reaction already exists
    const { data: existingReaction, error: existingError } = await supabase
      .from('message_reactions')
      .select()
      .eq('message_id', params.messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single();

    if (existingReaction) {
      // Remove existing reaction
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', params.messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);

      if (deleteError) throw deleteError;
    } else {
      // Check reaction limit per user
      const { count, error: countError } = await supabase
        .from('message_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('message_id', params.messageId)
        .eq('user_id', userId);

      if (countError) throw countError;
      if ((count ?? 0) >= 5) {
        return new NextResponse('Reaction limit reached', { status: 400 });
      }

      // Add new reaction
      const { error: insertError } = await supabase
        .from('message_reactions')
        .insert({
          message_id: params.messageId,
          user_id: userId,
          emoji
        });

      if (insertError) throw insertError;
    }

    // Get updated reactions
    const { data: reactions, error: reactionsError } = await supabase
      .from('message_reactions')
      .select(`
        *,
        user:users(*)
      `)
      .eq('message_id', params.messageId);

    if (reactionsError) throw reactionsError;

    return NextResponse.json(reactions);
  } catch (error) {
    console.error('Error managing reaction:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 