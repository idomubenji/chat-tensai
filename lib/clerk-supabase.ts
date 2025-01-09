import { auth } from '@clerk/nextjs';

export async function getSupabaseToken() {
  const { getToken } = auth();
  return getToken({ template: 'supabase' });
} 