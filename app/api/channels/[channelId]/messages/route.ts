import { createSupabaseAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { getAuthUserId, checkChannelExists, checkChannelMembership } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // First check if the channel exists
    const channel = await checkChannelExists(params.channelId);
    if (!channel) {
      return new NextResponse('Channel not found', { status: 404 });
    }

    // Then check if user is a member of the channel
    const membership = await checkChannelMembership(params.channelId, userId);
    if (!membership) {
      return new NextResponse('Not a member of this channel', { status: 403 });
    }

    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const before = searchParams.get('before');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50);

    // Debug log for request parameters
    console.log('Request parameters:', {
      before: before ? new Date(before) : null,
      limit,
      channelId: params.channelId
    });

    // Get messages with pagination
    const query = supabase
      .from('messages')
      .select(`
        *,
        user:users(*),
        reactions:message_reactions(
          *,
          user:users(*)
        ),
        files(*),
        replies:messages!parent_id(id)
      `)
      .eq('channel_id', params.channelId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      try {
        // Validate the timestamp
        const beforeDate = new Date(before);
        if (isNaN(beforeDate.getTime())) {
          throw new Error('Invalid timestamp format');
        }
        query.lt('created_at', beforeDate.toISOString());
      } catch (error) {
        console.error('Error parsing before timestamp:', error);
        return new NextResponse('Invalid timestamp format', { status: 400 });
      }
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    // Transform messages to include reply count and reverse to show oldest first
    const transformedMessages = messages?.map(message => ({
      ...message,
      replies: {
        count: Array.isArray(message.replies) ? message.replies.length : 0
      }
    })).reverse();

    // Debug logging
    console.log('Messages query result:', {
      count: transformedMessages?.length,
      firstMessage: transformedMessages?.[0],
      error: messagesError,
      params: {
        before,
        limit,
        channelId: params.channelId
      },
      replyCounts: transformedMessages?.map(m => ({
        messageId: m.id,
        replyCount: m.replies?.count
      }))
    });

    return NextResponse.json(transformedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // First check if the channel exists
    const channel = await checkChannelExists(params.channelId);
    if (!channel) {
      return new NextResponse('Channel not found', { status: 404 });
    }

    // Then check if user is a member of the channel
    const membership = await checkChannelMembership(params.channelId, userId);
    if (!membership) {
      return new NextResponse('Not a member of this channel', { status: 403 });
    }

    const body = await req.json();
    const { content, parent_id } = body;

    if (!content?.trim()) {
      return new NextResponse('Message content is required', { status: 400 });
    }

    // If this is a reply, verify parent message exists in the same channel
    if (parent_id) {
      const { data: parentMessage, error: parentError } = await supabase
        .from('messages')
        .select('channel_id')
        .eq('id', parent_id)
        .single();

      if (parentError || parentMessage.channel_id !== params.channelId) {
        return new NextResponse('Invalid parent message', { status: 400 });
      }
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        content,
        channel_id: params.channelId,
        user_id: userId,
        parent_id
      })
      .select(`
        *,
        user:users(*),
        reactions:message_reactions(
          *,
          user:users(*)
        )
      `)
      .single();

    if (messageError) throw messageError;

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

