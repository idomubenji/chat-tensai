import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Get the authenticated user's ID from the session
 * @returns The user ID if authenticated, null otherwise
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.error('Error getting session:', error);
      return null;
    }

    return session.user.id;
  } catch (error) {
    console.error('Error in getAuthUserId:', error);
    return null;
  }
}

/**
 * Get the authenticated user's session
 * @returns The session if authenticated, null otherwise
 */
export async function getAuthSession() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error in getAuthSession:', error);
    return null;
  }
}

/**
 * Check if a channel exists
 * @param channelId The channel ID to check
 * @returns The channel if it exists, null otherwise
 */
export async function checkChannelExists(channelId: string) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: channel, error } = await supabase
      .from('channels')
      .select()
      .eq('id', channelId)
      .single();

    if (error) {
      console.error('Channel check error:', error);
      return null;
    }

    return channel;
  } catch (error) {
    console.error('Error in checkChannelExists:', error);
    return null;
  }
}

/**
 * Check if a user is a member of a channel
 * @param channelId The channel ID to check
 * @param userId The user ID to check
 * @returns The membership if it exists, null otherwise
 */
export async function checkChannelMembership(channelId: string, userId: string) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: membership, error } = await supabase
      .from('channel_members')
      .select()
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Membership check error:', error);
      return null;
    }

    return membership;
  } catch (error) {
    console.error('Error in checkChannelMembership:', error);
    return null;
  }
} 