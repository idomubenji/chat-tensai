import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const isProduction = process.env.NODE_ENV === 'production';

// URLs and keys based on environment
const supabaseUrl = isProduction
  ? process.env.NEXT_PUBLIC_PRODUCTION_SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey = isProduction
  ? process.env.NEXT_PUBLIC_PRODUCTION_SUPABASE_ANON_KEY!
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseServiceRoleKey = isProduction
  ? process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY!
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create clients
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper to create a client with custom headers (for Clerk auth)
export const createSupabaseClient = (headers?: Record<string, string>) => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: headers || {},
    },
    auth: {
      persistSession: false,
    },
  });
};

// Helper to create an admin client (for server-side operations)
export const createSupabaseAdminClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}; 