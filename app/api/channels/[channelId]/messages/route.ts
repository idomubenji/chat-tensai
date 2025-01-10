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
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

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
      .order('created_at', { ascending: true })
      .limit(limit);

    if (cursor) {
      query.gt('created_at', cursor);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) throw messagesError;

    // Transform messages to include reply count
    const transformedMessages = messages?.map(message => ({
      ...message,
      replies: {
        count: Array.isArray(message.replies) ? message.replies.length : 0
      }
    }));

    // Debug logging
    console.log('Messages query result:', {
      count: transformedMessages?.length,
      firstMessage: transformedMessages?.[0],
      error: messagesError,
      replyCounts: transformedMessages?.map(m => ({
        messageId: m.id,
        replyCount: m.replies?.count,
        fullReplies: m.replies
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

