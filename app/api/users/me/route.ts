import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return new NextResponse('Error fetching user data', { status: 500 });
    }

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

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
    console.error('Error in /api/users/me:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { bio, status_message, status_emoji, avatar_url, name } = body;

    // Validate status message length
    if (status_message && status_message.length > 25) {
      return new NextResponse('Status message must be 25 characters or less', { status: 400 });
    }

    // Update user profile
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
      .eq('id', session.user.id)
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
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First, delete all user's messages
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', session.user.id);

    if (messagesError) throw messagesError;

    // Finally, delete the user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', session.user.id);

    if (userError) throw userError;

    // Sign out the user
    await supabase.auth.signOut();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

