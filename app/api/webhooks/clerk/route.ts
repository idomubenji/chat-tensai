import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  console.log('Webhook received');
  try {
    // Get the webhook secret from environment variables
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error('Missing CLERK_WEBHOOK_SECRET');
      throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
    }

    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    console.log('Webhook headers:', {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature?.slice(0, 10) + '...' // Log partial signature for security
    });

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing required Svix headers');
      return new NextResponse('Error occured -- no svix headers', {
        status: 400,
      });
    }

    // Get the body
    const payload = await req.json();
    console.log('Webhook payload:', {
      type: payload.type,
      data: {
        id: payload.data?.id,
        email_addresses: payload.data?.email_addresses,
        first_name: payload.data?.first_name,
        last_name: payload.data?.last_name
      }
    });
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
      console.log('Webhook verified successfully');
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new NextResponse('Error occured', {
        status: 400,
      });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Handle the webhook
    const eventType = evt.type;
    console.log('Processing webhook event:', eventType);

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      console.log('Processing user data:', {
        id,
        email: email_addresses[0]?.email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        image_url
      });

      // Upsert user data
      const { data: upsertData, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id,
          email: email_addresses[0]?.email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim(),
          avatar_url: image_url,
          role: 'USER', // Set default role
          status: 'ONLINE', // Set default status
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Error upserting user:', upsertError);
        throw upsertError;
      }
      console.log('User upserted successfully:', upsertData);
    } else if (eventType === 'user.deleted') {
      const { id } = evt.data;
      console.log('Processing user deletion:', { id });

      // Delete user data
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        throw deleteError;
      }
      console.log('User deleted successfully');
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 