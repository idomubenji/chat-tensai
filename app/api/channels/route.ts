import { createSupabaseAdminClient } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if user is authenticated
    const userId = await getAuthUserId();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Use admin client to fetch channels
    const supabase = createSupabaseAdminClient();
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