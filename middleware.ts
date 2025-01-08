import { authMiddleware, clerkClient } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

// Initialize Supabase admin client
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default authMiddleware({
  afterAuth: async (auth, req) => {
    const res = NextResponse.next();

    // Only proceed if we have a user
    if (auth.userId) {
      try {
        console.log('\n=== MIDDLEWARE: USER SYNC START ===');
        // Get user details from Clerk
        const user = await clerkClient.users.getUser(auth.userId);
        
        console.log('Syncing Clerk user to Supabase:', {
          clerkUserId: user.id,
          clerkUserIdType: typeof user.id,
          clerkEmail: user.emailAddresses[0]?.emailAddress,
          clerkName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        });

        // First check if user exists and get their current avatar
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, avatar_url')
          .eq('id', user.id)
          .single();

        console.log('Existing user check:', {
          exists: !!existingUser,
          lookupId: user.id,
          currentAvatar: existingUser?.avatar_url
        });

        // Upsert user into Supabase
        const { data, error } = await supabaseAdmin
          .from('users')
          .upsert({
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
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
            details: error.details
          });
        } else {
          console.log('User upserted successfully:', {
            userId: data.id,
            email: data.email,
            name: data.name
          });
        }
        console.log('=== MIDDLEWARE: USER SYNC END ===\n');
      } catch (error) {
        console.error('Error in middleware:', error);
      }
    }

    return res;
  },
  publicRoutes: ['/api/webhooks/clerk']
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
