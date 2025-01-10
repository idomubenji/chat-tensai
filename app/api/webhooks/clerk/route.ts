import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs';

// Initialize Supabase admin client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  console.log('\n=== WEBHOOK REQUEST RECEIVED ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  // Log all headers
  const headersList = headers();
  console.log('\n=== All Request Headers ===');
  headersList.forEach((value, key) => {
    console.log(`${key}: ${key.toLowerCase().includes('signature') ? value.slice(0, 10) + '...' : value}`);
  });

  try {
    // Get the webhook secret from environment variables
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error('\n=== ERROR: Missing CLERK_WEBHOOK_SECRET ===');
      console.log('Available environment variables:', Object.keys(process.env).join(', '));
      throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
    }

    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    console.log('\n=== Webhook Headers ===', {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature?.slice(0, 10) + '...'
    });

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('\n=== ERROR: Missing required Svix headers ===');
      return new NextResponse('Error occured -- no svix headers', {
        status: 400,
      });
    }

    // Get the body
    const payload = await req.json();
    console.log('=== Full webhook payload ===', JSON.stringify(payload, null, 2));

    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
      console.log('=== Webhook verified successfully ===');
      console.log('=== Event type and data ===', {
        type: evt.type,
        data: evt.data
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new NextResponse('Error occured', {
        status: 400,
      });
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log('=== Processing webhook event ===:', eventType);

    // Only process user-related events
    if (eventType === 'user.created' || eventType === 'user.updated' || eventType === 'session.created') {
      let userId: string | undefined;

      // Extract user ID based on event type
      if (eventType === 'session.created') {
        const sessionData = evt.data as any;
        userId = sessionData.user_id;
        console.log('=== Session created for user ===:', userId);
      } else {
        // For user events
        const userData = evt.data as any;
        userId = userData.id;
        console.log('=== User event for user ===:', userId);
      }

      if (!userId) {
        console.error('No user ID found in webhook data');
        return new NextResponse('No user ID found', { status: 400 });
      }

      try {
        // Fetch user data from Clerk
        console.log('=== Fetching user data from Clerk ===');
        const user = await clerkClient.users.getUser(userId);
        console.log('=== Raw Clerk user data ===:', JSON.stringify(user, null, 2));

        const primaryEmail = user.primaryEmailAddressId ? 
          user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress : 
          user.emailAddresses[0]?.emailAddress;

        if (!primaryEmail) {
          console.error('No email address found for user');
          return new NextResponse('No email address found', { status: 400 });
        }

        // Get username from Clerk or generate from email
        const username = user.username || primaryEmail.split('@')[0];
        const finalUsername = username.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        console.log('=== Processing user data ===:', {
          userId,
          email: primaryEmail,
          username: finalUsername
        });

        // Upsert user data
        const { data: upsertData, error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: primaryEmail,
            name: finalUsername,
            avatar_url: null, // Explicitly set to null
            role: 'USER',
            status: 'ONLINE',
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (upsertError) {
          console.error('=== Error upserting user ===:', upsertError);
          throw upsertError;
        }
        console.log('=== User upserted successfully ===:', upsertData);

        // Add user to all channels for new users or sessions
        if (eventType === 'user.created' || eventType === 'session.created') {
          console.log('=== Adding user to all channels ===');
          
          // Get all channels
          const { data: channels, error: channelsError } = await supabase
            .from('channels')
            .select('id');

          if (channelsError) {
            console.error('=== Error fetching channels ===:', channelsError);
            throw channelsError;
          }

          if (!channels || channels.length === 0) {
            console.log('=== No channels found ===');
            return new NextResponse('Webhook processed successfully', { status: 200 });
          }

          console.log('=== Found channels ===:', channels);

          // Add user to each channel
          for (const channel of channels) {
            try {
              // Check if user is already a member
              const { data: existingMembership, error: membershipError } = await supabase
                .from('channel_members')
                .select()
                .eq('channel_id', channel.id)
                .eq('user_id', userId)
                .maybeSingle();

              if (membershipError) {
                console.error('=== Error checking membership ===:', membershipError);
                continue;
              }

              // If not already a member, add them
              if (!existingMembership) {
                const { error: addError } = await supabase
                  .from('channel_members')
                  .insert({
                    channel_id: channel.id,
                    user_id: userId,
                    role_in_channel: 'MEMBER'
                  });

                if (addError) {
                  console.error(`=== Error adding user ${userId} to channel ${channel.id} ===:`, addError);
                  continue;
                }
                console.log(`=== Added user ${userId} to channel ${channel.id} ===`);
              } else {
                console.log(`=== User ${userId} is already a member of channel ${channel.id} ===`);
              }
            } catch (error) {
              console.error(`=== Error processing channel ${channel.id} ===:`, error);
              continue;
            }
          }
        }
      } catch (error) {
        console.error('=== Error processing user ===:', error);
        throw error;
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('=== Error processing webhook ===:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 