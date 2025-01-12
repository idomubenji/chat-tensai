import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function POST(request: Request) {
  try {
    console.log('\n=== ONBOARDING START ===');
    console.log('[/api/users/onboard] Starting request');
    
    // Log all cookies first
    const allCookies = cookies().getAll();
    console.log('[/api/users/onboard] Available cookies:', {
      count: allCookies.length,
      names: allCookies.map(c => c.name),
      sbCookies: allCookies.filter(c => c.name.includes('sb-')).map(c => c.name)
    });

    const requestData = await request.json();
    const { userId, email, username } = requestData;
    console.log('[/api/users/onboard] Request data:', { 
      userId, 
      email, 
      username,
      allData: requestData 
    });

    console.log('[/api/users/onboard] Creating Supabase client');
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check auth state
    console.log('[/api/users/onboard] Checking auth state');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[/api/users/onboard] Auth state:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      requestUserId: userId,
      sessionEmail: session?.user?.email,
      requestEmail: email,
      accessToken: session?.access_token ? 'present' : 'missing',
      refreshToken: session?.refresh_token ? 'present' : 'missing'
    });

    if (sessionError) {
      console.error('[/api/users/onboard] Session error:', {
        error: sessionError,
        message: sessionError.message,
        name: sessionError.name,
        stack: sessionError.stack
      });
      throw sessionError;
    }

    if (!session?.user) {
      console.error('[/api/users/onboard] No session user found');
      throw new Error('No session user found during onboarding');
    }

    console.log('[/api/users/onboard] Checking for existing user');
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('[/api/users/onboard] Error checking for existing user:', {
        error: fetchError,
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details
      });
      throw fetchError;
    }

    if (!existingUser) {
      console.log('[/api/users/onboard] Attempting to create new user:', { 
        userId, 
        email, 
        username,
        sessionUserId: session.user.id 
      });
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email,
            name: username || email.split('@')[0],
            role: 'USER',
            status: 'ONLINE',
          },
        ]);

      if (insertError) {
        console.error('[/api/users/onboard] Error creating user:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details
        });
        throw insertError;
      }
      console.log('[/api/users/onboard] Successfully created new user');
    }

    console.log('[/api/users/onboard] Fetching final user data');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[/api/users/onboard] Error fetching updated user:', {
        error: userError,
        code: userError.code,
        message: userError.message,
        details: userError.details
      });
      throw userError;
    }

    console.log('[/api/users/onboard] Onboarding completed successfully:', { 
      userId, 
      user,
      sessionUserId: session.user.id 
    });
    console.log('=== ONBOARDING END ===\n');
    return NextResponse.json(user);
  } catch (error) {
    console.error('[/api/users/onboard] Unhandled error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during onboarding' },
      { status: 500 }
    );
  }
} 