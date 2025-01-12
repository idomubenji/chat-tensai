import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { Database } from '@/types/supabase';
import { rateLimit } from '@/lib/rate-limit';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Apply rate limiting
    const { limited, response } = rateLimit(session.user.id);
    if (limited) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const query = searchQuerySchema.parse({
      q: searchParams.get('q'),
      limit: Number(searchParams.get('limit')) || 20,
      offset: Number(searchParams.get('offset')) || 0,
    });

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .textSearch('content', query.q)
      .range(query.offset, query.offset + query.limit - 1);

    if (error) {
      console.error('Error searching messages:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error in search route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

