import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// URLs and keys based on environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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