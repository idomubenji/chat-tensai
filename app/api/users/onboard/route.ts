import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function POST(request: Request) {
  try {
    const { userId, email, username } = await request.json();
    const supabase = createRouteHandlerClient<Database>({ cookies });

    console.log('Starting onboarding for user:', { userId, email, username });

    // First, check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking for existing user:', fetchError);
      throw fetchError;
    }

    // If user doesn't exist, create them with the provided username
    if (!existingUser) {
      console.log('Creating new user:', { userId, email, username });
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email,
            name: username || email.split('@')[0], // Use username if provided, otherwise use email prefix
            role: 'USER',
            status: 'ONLINE',
          },
        ]);

      if (insertError) {
        console.error('Error creating user:', insertError);
        throw insertError;
      }
    }

    // Get the updated user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching updated user:', userError);
      throw userError;
    }

    console.log('Onboarding completed successfully for user:', userId);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in onboarding:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during onboarding' },
      { status: 500 }
    );
  }
} 