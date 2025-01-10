import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

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
  try {
    console.log('\n=== DATABASE WEBHOOK: START ===');
    
    // Verify webhook secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
      console.error('Invalid webhook secret');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await req.json();
    console.log('Received webhook payload:', {
      type: payload.type,
      table: payload.table,
      schema: payload.schema,
      record: {
        ...payload.record,
        // Don't log sensitive data
        encrypted_password: undefined,
        email_confirmed_at: undefined,
        confirmation_sent_at: undefined,
        confirmation_token: undefined,
        recovery_sent_at: undefined,
        recovery_token: undefined,
        reauthentication_sent_at: undefined,
        reauthentication_token: undefined,
      }
    });

    // Handle user-related events
    if (payload.type === 'INSERT' && payload.table === 'users' && payload.schema === 'auth') {
      const userId = payload.record.id;
      const email = payload.record.email;
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      console.log('Processing new user:', { userId, email, username });

      // Upsert user data
      const { data: userData, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: email,
          name: username,
          avatar_url: null,
          role: 'USER',
          status: 'ONLINE',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Error upserting user:', upsertError);
        throw upsertError;
      }

      console.log('User data upserted:', userData);

      // Get all channels
      let { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('id');

      if (channelsError) {
        console.error('Error fetching channels:', channelsError);
        throw channelsError;
      }

      // Create general channel if no channels exist
      if (!channels || channels.length === 0) {
        console.log('No channels found, creating general channel');
        const { data: generalChannel, error: createError } = await supabase
          .from('channels')
          .insert({
            name: 'general',
            description: 'General discussion',
            created_by_id: userId
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating general channel:', createError);
          throw createError;
        }

        console.log('Created general channel:', generalChannel);
      }
    }

    console.log('=== DATABASE WEBHOOK: SUCCESS ===\n');
    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('=== DATABASE WEBHOOK: ERROR ===');
    console.error('Error processing webhook:', error);
    console.error('=== DATABASE WEBHOOK: END ===\n');
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 