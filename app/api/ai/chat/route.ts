import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { getAuthUserId } from '@/lib/auth';
import { setCorsHeaders } from '@/utils/cors-config';

interface ChatRequest {
  message: string;
  mentionedUsername?: string;
}

export async function OPTIONS(req: Request) {
  // For OPTIONS requests, we want to allow the request regardless of auth
  const response = new NextResponse(null, { status: 204 });
  setCorsHeaders(req, response);
  return response;
}

export async function POST(req: Request) {
  try {
    // Debug log request details
    console.log('[AI Chat] Request:', {
      headers: {
        origin: req.headers.get('origin'),
        'x-api-key': req.headers.get('x-api-key') ? 'PRESENT' : 'MISSING',
        cookie: req.headers.get('cookie') ? 'PRESENT' : 'MISSING',
        'content-type': req.headers.get('content-type')
      },
      method: req.method,
      url: req.url
    });

    // Check API key first
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
      console.error('[AI Chat] Missing API key');
      const response = NextResponse.json(
        { error: 'Unauthorized - Missing API key' },
        { status: 401 }
      );
      setCorsHeaders(req, response);
      return response;
    }

    if (apiKey !== process.env.NEXT_PUBLIC_TENSAI_KEY) {
      console.error('[AI Chat] Invalid API key');
      const response = NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
      setCorsHeaders(req, response);
      return response;
    }

    // Check auth
    const userId = await getAuthUserId();
    console.log('[AI Chat] Auth check:', {
      userId,
      hasUserId: !!userId,
      cookies: cookies().getAll().map(c => c.name)
    });

    if (!userId) {
      const response = NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
      setCorsHeaders(req, response);
      return response;
    }

    // Parse request body
    let body: ChatRequest;
    try {
      body = await req.json();
    } catch (error) {
      console.error('[AI Chat] Error parsing request body:', error);
      const response = NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
      setCorsHeaders(req, response);
      return response;
    }

    if (!body.message?.trim()) {
      const response = NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
      setCorsHeaders(req, response);
      return response;
    }

    // Process the chat message
    const response = NextResponse.json({
      content: `You said: ${body.message}`,
      username: 'AI Assistant',
      avatarUrl: '/default-avatar.jpeg'
    });
    
    setCorsHeaders(req, response);
    return response;
  } catch (error) {
    console.error('[AI Chat] Unhandled error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    const response = NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    setCorsHeaders(req, response);
    return response;
  }
}

export const dynamic = 'force-dynamic'; 