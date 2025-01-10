import { clerkClient } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== Starting user sync ===');
    
    // Get the current user from Clerk
    const { userId } = auth();
    if (!userId) {
      console.error('No user ID from Clerk auth');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('Processing user:', userId);

    // Get user data from Clerk
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      console.error('User not found in Clerk');
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }
    
    // Get username and email from Clerk
    const username = user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0];
    const email = user.emailAddresses[0]?.emailAddress;
    
    if (!username || !email) {
      console.error('Missing required user data:', { username, email });
      return NextResponse.json({ error: 'Missing required user data' }, { status: 400 });
    }
    
    console.log('User data from Clerk:', { userId, username, email });

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Upsert user in Supabase
    const { data: userData, error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        name: username,
        email: email,
        avatar_url: null,
        role: 'USER',
        status: 'ONLINE',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting user:', upsertError);
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }
    
    console.log('User synced successfully:', userData);

    // Get all channels
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id');

    if (channelsError) {
      console.error('Error fetching channels:', channelsError);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    console.log('Adding user to channels:', channels);

    // Add user to all channels if they're not already a member
    for (const channel of channels) {
      const { error: memberError } = await supabase
        .from('channel_members')
        .upsert({
          channel_id: channel.id,
          user_id: userId,
          role: 'USER'
        });

      if (memberError) {
        console.error(`Error adding user to channel ${channel.id}:`, memberError);
      } else {
        console.log(`Added user to channel ${channel.id}`);
      }
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 