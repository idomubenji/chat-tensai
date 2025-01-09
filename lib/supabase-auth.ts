import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function useSupabaseClient() {
  const { getToken } = useAuth();
  const [supabase, setSupabase] = useState(() => createClientComponentClient<Database>());

  useEffect(() => {
    const updateClient = async () => {
      try {
        console.log('=== SUPABASE CLIENT INIT START ===');
        const token = await getToken({ 
          template: 'supabase',
          skipCache: true
        });
        console.log('Clerk token received:', token ? `${token.substring(0, 100)}...` : 'No token');
        
        if (!token) {
          console.error('No token received from Clerk');
          return;
        }

        // Decode and log JWT payload for debugging
        try {
          const [header, payload] = token.split('.');
          console.log('JWT header:', JSON.parse(atob(header)));
          console.log('JWT payload:', JSON.parse(atob(payload)));
        } catch (e) {
          console.error('Error decoding JWT:', e);
        }

        // Create headers with the token
        const headers = {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'X-Client-Info': 'supabase-js/2.38.4'
        };
        console.log('Creating Supabase client with headers:', {
          ...headers,
          Authorization: headers.Authorization.substring(0, 50) + '...',
          apikey: headers.apikey.substring(0, 20) + '...'
        });

        // Create new client with the token
        const newClient = createClientComponentClient<Database>({
          options: {
            global: {
              headers
            }
          }
        });

        // Test auth is working
        console.log('Testing auth_uid() function...');
        try {
          const { data: authData, error: authError } = await newClient.rpc('auth_uid');
          console.log('Auth test result:', { authData, authError });

          if (authError) {
            console.error('Auth test failed:', authError);
            // Continue anyway to see if channels query works
          }
        } catch (e) {
          console.error('Error calling auth_uid():', e);
        }

        // Test channels query
        console.log('Testing channels query...');
        try {
          const { data: channels, error: channelsError } = await newClient
            .from('channels')
            .select('*')
            .limit(1);
          console.log('Channels test result:', { channels, channelsError });

          if (channelsError) {
            console.error('Channels test failed:', channelsError);
            return;
          }
        } catch (e) {
          console.error('Error querying channels:', e);
        }

        setSupabase(newClient);
        console.log('=== SUPABASE CLIENT INIT END ===');
      } catch (error) {
        console.error('Error in updateClient:', error);
      }
    };

    // Update client immediately
    updateClient();

    // Set up an interval to refresh the token periodically
    const interval = setInterval(updateClient, 55 * 60 * 1000); // Refresh every 55 minutes

    return () => clearInterval(interval);
  }, [getToken]);

  return supabase;
} 