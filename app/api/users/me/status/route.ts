import { auth } from '@clerk/nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function PATCH(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !['ONLINE', 'AWAY', 'OFFLINE'].includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Update user status
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 