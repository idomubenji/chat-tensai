import { authMiddleware, clerkClient } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { getSupabaseToken } from '@/lib/clerk-supabase';

// Initialize Supabase admin client using our environment-aware helper
const supabaseAdmin = createSupabaseAdminClient();

// Cache to store last sync time for each user
const userSyncCache = new Map<string, number>();
const SYNC_INTERVAL = 60 * 1000; // 1 minute

async function shouldSyncUser(userId: string): Promise<boolean> {
  const lastSync = userSyncCache.get(userId);
  const now = Date.now();

  if (!lastSync || now - lastSync >= SYNC_INTERVAL) {
    userSyncCache.set(userId, now);
    return true;
  }

  return false;
}

export default authMiddleware({
  afterAuth: async (auth, req) => {
    // Create a new response
    const res = NextResponse.next();

    // Only proceed if we have a user
    if (auth.userId) {
      try {
        console.log('\n=== MIDDLEWARE: USER SYNC START ===');
        // Get user details from Clerk
        const user = await clerkClient.users.getUser(auth.userId);
        
        // First check if user exists and get their current avatar
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, avatar_url, email, name, updated_at')
          .eq('id', user.id)
          .single();

        const newEmail = user.emailAddresses[0]?.emailAddress;
        const newName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

        // Only update if user doesn't exist or data has changed
        if (!existingUser || 
            existingUser.email !== newEmail || 
            existingUser.name !== newName) {
          
          console.log('Syncing Clerk user to Supabase - data changed:', {
            clerkUserId: user.id,
            oldEmail: existingUser?.email,
            newEmail,
            oldName: existingUser?.name,
            newName,
            environment: process.env.NODE_ENV
          });

          // Upsert user into Supabase
          const { data, error } = await supabaseAdmin
            .from('users')
            .upsert({
              id: user.id,
              email: newEmail,
              name: newName,
              avatar_url: existingUser?.avatar_url || '/default-avatar.jpeg',
              role: 'USER',
              status: 'ONLINE',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            .select()
            .single();

          if (error) {
            console.error('Error upserting user:', {
              error,
              userId: user.id,
              errorCode: error.code,
              errorMessage: error.message,
              details: error.details,
              environment: process.env.NODE_ENV
            });
          } else {
            console.log('User upserted successfully:', {
              userId: data.id,
              email: data.email,
              name: data.name,
              environment: process.env.NODE_ENV
            });
          }
        } else {
          console.log('No sync needed - user data unchanged');
        }

        // Get the Supabase token and set it in the response headers
        const token = await getSupabaseToken();
        if (token) {
          res.headers.set('Authorization', `Bearer ${token}`);
        }

        console.log('=== MIDDLEWARE: USER SYNC END ===');
      } catch (error) {
        console.error('Error in middleware:', error);
      }
    }

    return res;
  },
  publicRoutes: ['/api/webhooks/clerk']
});

export const config = {
  matcher: [
    // Match all routes except static files, _next, and api/webhooks
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
};
