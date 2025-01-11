import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Log environment variables for debugging
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

    // Test direct HTTP connection
    const directResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=count`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!directResponse.ok) {
      throw new Error(`Direct HTTP failed: ${directResponse.status} ${directResponse.statusText}`);
    }

    // Test Supabase client connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      directHttpStatus: directResponse.status,
      supabaseCount: count
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 