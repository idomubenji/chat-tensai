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
        console.log('Getting Clerk token for Supabase...');
        const token = await getToken({ 
          template: 'supabase',
          skipCache: true
        });
        console.log('Clerk token received:', token ? token.substring(0, 20) + '...' : 'No token');
        
        if (token) {
          console.log('Creating new Supabase client with token...');
          const headers = {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${token}`,
            'X-JWT-Template': 'supabase'
          };
          console.log('Headers:', headers);
          
          const newClient = createClientComponentClient<Database>({
            options: {
              global: {
                headers
              }
            }
          });

          // Test the client
          console.log('Testing Supabase client...');
          const { data, error } = await newClient.from('channel_members').select('*');
          if (error) {
            console.error('Test query error:', error);
          } else {
            console.log('Test query result:', { data, error });
          }

          setSupabase(newClient);
          console.log('New Supabase client created with token');
        }
      } catch (error) {
        console.error('Error updating Supabase auth:', error);
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