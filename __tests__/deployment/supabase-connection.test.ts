import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

describe('Supabase Connection Tests', () => {
  test('environment variables are properly formatted', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Supabase URL:', supabaseUrl);
    console.log('Anon Key Length:', anonKey?.length);
    console.log('Service Key Length:', serviceKey?.length);

    // Check URL format
    expect(supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
    
    // Check JWT format for keys
    const jwtPattern = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    expect(anonKey).toMatch(jwtPattern);
    expect(serviceKey).toMatch(jwtPattern);
  });

  test('can make direct HTTP request to Supabase', async () => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id&limit=1`;
    console.log('Testing URL:', url);
    
    const headers = {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Request Headers:', headers);
    
    try {
      const response = await fetch(url, { headers });
      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);
      
      const data = await response.json();
      console.log('Response Data:', data);
      
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Fetch Error:', error);
      throw error;
    }
  });

  test('can verify JWT claims in keys', () => {
    const decodeJWT = (token: string) => {
      const [header, payload] = token.split('.').slice(0, 2);
      return {
        header: JSON.parse(Buffer.from(header, 'base64').toString()),
        payload: JSON.parse(Buffer.from(payload, 'base64').toString())
      };
    };

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const anonClaims = decodeJWT(anonKey);
    const serviceClaims = decodeJWT(serviceKey);

    console.log('Anon Key Claims:', anonClaims);
    console.log('Service Key Claims:', serviceClaims);

    expect(anonClaims.payload.role).toBe('anon');
    expect(serviceClaims.payload.role).toBe('service_role');
  });
}); 