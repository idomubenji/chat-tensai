require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('Environment Variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Has NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log('Has SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    console.log('\nTesting connection...');
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log('Success! Data:', data);
    process.exit(0);
  } catch (error) {
    console.error('Caught error:', error);
    process.exit(1);
  }
}

testConnection(); 