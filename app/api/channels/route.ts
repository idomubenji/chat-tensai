import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching channels:', error);
      return new NextResponse('Error fetching channels', { status: 500 });
    }

    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error in channels route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 