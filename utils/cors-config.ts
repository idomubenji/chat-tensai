import { NextResponse } from 'next/server';

const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://chat-tensai.vercel.app',
  'https://ragtime-tensai.vercel.app'
];

const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Tensai-Key',
  'Access-Control-Max-Age': '86400'
};

export function setCorsHeaders(req: Request, res: NextResponse): void {
  const origin = req.headers.get('origin');
  
  // Only set Access-Control-Allow-Origin if origin is in allowedOrigins
  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    // Set other CORS headers only if origin is allowed
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
  } else {
    // For non-allowed origins, don't set any CORS headers
    console.warn(`[CORS] Blocked request from non-allowed origin: ${origin}`);
  }
}

export function handleCorsPreflightRequest(req: Request): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  setCorsHeaders(req, response);
  return response;
} 