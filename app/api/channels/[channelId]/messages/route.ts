import { auth } from '@clerk/nextjs';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function GET(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // First check if the channel exists
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select()
      .eq('id', params.channelId)
      .single();

    if (channelError) {
      console.error('Channel check error:', channelError);
      if (channelError.code === 'PGRST116') {
        return new NextResponse('Channel not found', { status: 404 });
      }
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // Then check if user is a member of the channel
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select()
      .eq('channel_id', params.channelId)
      .eq('user_id', userId)
      .single();

    if (membershipError) {
      console.error('Membership check error:', membershipError);
      if (membershipError.code === 'PGRST116') {
        return new NextResponse('Not a member of this channel', { status: 403 });
      }
      return new NextResponse('Internal Server Error', { status: 500 });
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
        files(*)
      `)
      .eq('channel_id', params.channelId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (cursor) {
      query.gt('created_at', cursor);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) throw messagesError;

    return NextResponse.json(messages);
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
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // First check if the channel exists
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select()
      .eq('id', params.channelId)
      .single();

    if (channelError) {
      console.error('Channel check error:', channelError);
      if (channelError.code === 'PGRST116') {
        return new NextResponse('Channel not found', { status: 404 });
      }
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // Then check if user is a member of the channel
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select()
      .eq('channel_id', params.channelId)
      .eq('user_id', userId)
      .single();

    if (membershipError) {
      console.error('Membership check error:', membershipError);
      if (membershipError.code === 'PGRST116') {
        return new NextResponse('Not a member of this channel', { status: 403 });
      }
      return new NextResponse('Internal Server Error', { status: 500 });
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

