import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Create clients only when needed
export function getSupabaseClient(headers?: Record<string, string>) {
  const supabaseUrl = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: headers || {},
    },
    auth: {
      persistSession: false,
    },
  });
}

export function getSupabaseAdmin() {
  const supabaseUrl = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseServiceRoleKey = getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Backwards compatibility for existing code
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdmin();
export const createSupabaseClient = getSupabaseClient;
export const createSupabaseAdminClient = getSupabaseAdmin; 