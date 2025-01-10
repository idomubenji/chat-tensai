import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('=== Fetching user profile ===', { userId });

    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get user profile with all fields
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('=== Error fetching user profile ===:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('=== User profile fetched successfully ===:', user);
    return NextResponse.json(user);
  } catch (error) {
    console.error('=== Error fetching user profile ===:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { bio, status_message, status_emoji, avatar_url, name } = body;

    // Validate status message length
    if (status_message && status_message.length > 25) {
      return NextResponse.json({ error: 'Status message must be 25 characters or less' }, { status: 400 });
    }

    console.log('=== Attempting to update user profile ===:', {
      userId,
      bio,
      status_message,
      status_emoji,
      avatar_url,
      name
    });

    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });

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
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('=== Error updating user profile ===:', {
        error: updateError,
        userId,
        code: updateError.code,
        message: updateError.message
      });
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    console.log('=== Successfully updated user profile ===:', user);
    return NextResponse.json(user);
  } catch (error) {
    console.error('=== Error updating user profile ===:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });

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

    // Sign out the user
    await supabase.auth.signOut();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('=== Error deleting user ===:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

