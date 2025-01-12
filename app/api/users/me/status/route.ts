import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user status:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json({
      id: user.id,
      status: user.status || 'online',
      lastSeen: user.last_seen_at
    });
  } catch (error) {
    console.error('Error in status route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 