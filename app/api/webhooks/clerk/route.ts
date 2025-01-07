import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occured', {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;

    const primaryEmail = email_addresses?.[0]?.email_address;
    if (!primaryEmail) {
      return new NextResponse('No email address found', { status: 400 });
    }

    try {
      await prisma.user.upsert({
        where: { id },
        create: {
          id,
          email: primaryEmail,
          name: [first_name, last_name].filter(Boolean).join(' ') || 'Anonymous User',
          avatarUrl: image_url,
          status: 'OFFLINE',
          role: (public_metadata?.role as string === 'admin') ? 'ADMIN' : 'USER',
        },
        update: {
          email: primaryEmail,
          name: [first_name, last_name].filter(Boolean).join(' ') || 'Anonymous User',
          avatarUrl: image_url,
          role: (public_metadata?.role as string === 'admin') ? 'ADMIN' : 'USER',
        },
      });

      return new NextResponse('User synced successfully', { status: 200 });
    } catch (error) {
      console.error('Error syncing user:', error);
      return new NextResponse('Error syncing user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      await prisma.user.delete({
        where: { id },
      });

      return new NextResponse('User deleted successfully', { status: 200 });
    } catch (error) {
      console.error('Error deleting user:', error);
      return new NextResponse('Error deleting user', { status: 500 });
    }
  }

  return new NextResponse('Webhook received', { status: 200 });
} 