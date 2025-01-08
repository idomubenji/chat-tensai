import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

// Initialize Supabase admin client
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user profile with all fields
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { bio, status_message, status_emoji, avatar_url } = body;

    // Validate status message length
    if (status_message && status_message.length > 25) {
      return new NextResponse('Status message must be 25 characters or less', { status: 400 });
    }

    console.log('Attempting to update user profile:', {
      userId,
      bio,
      status_message,
      status_emoji,
      avatar_url
    });

    // Update user profile using admin client
    const { data: user, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        bio,
        status_message,
        status_emoji,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', {
        error: updateError,
        userId,
        code: updateError.code,
        message: updateError.message
      });
      throw updateError;
    }

    console.log('Successfully updated user profile:', user);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First, delete all user's messages
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('user_id', userId);

    if (messagesError) throw messagesError;

    // Delete all user's channel memberships
    const { error: membershipError } = await supabaseAdmin
      .from('channel_members')
      .delete()
      .eq('user_id', userId);

    if (membershipError) throw membershipError;

    // Finally, delete the user
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) throw userError;

    // Note: The user will still need to be deleted from Clerk
    // This should be handled by a Clerk webhook that triggers when the user is deleted from Supabase

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

