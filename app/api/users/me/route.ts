import { createSupabaseAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('[/api/users/me] Session found, fetching user data', {
      userId
    });
    
    const supabase = createSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[/api/users/me] Database error:', {
        error,
        userId,
        message: error.message,
        code: error.code
      });
      return new NextResponse('Error fetching user data', { status: 500 });
    }

    if (!user) {
      console.error('[/api/users/me] User not found in database:', userId);
      return new NextResponse('User not found', { status: 404 });
    }

    console.log('[/api/users/me] Successfully fetched user data');
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      status: user.status,
      last_seen_at: user.last_seen_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error) {
    console.error('[/api/users/me] Unhandled error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { bio, status_message, status_emoji, avatar_url, name } = body;

    // Validate status message length
    if (status_message && status_message.length > 25) {
      return new NextResponse('Status message must be 25 characters or less', { status: 400 });
    }

    // Update user profile
    const supabase = createSupabaseAdminClient();
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({
        bio,
        status_message,
        status_emoji,
        avatar_url,
        name,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return new NextResponse('Failed to update profile', { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // First, delete all user's messages
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId);

    if (messagesError) throw messagesError;

    // Finally, delete the user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) throw userError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

