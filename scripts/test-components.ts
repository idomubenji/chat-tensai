import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import fs from 'fs';
import path from 'path';

async function testFileUploads() {
  console.log('\n🔍 Testing File Uploads...');
  
  const testImagePath = path.join(process.cwd(), 'public', 'test-avatar.png');
  if (!fs.existsSync(testImagePath)) {
    console.error('❌ Test image not found');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('file', new Blob([fs.readFileSync(testImagePath)]));

    const response = await fetch('http://localhost:3000/api/users/me/avatar', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ File upload successful:', data.url);
    return true;
  } catch (error) {
    console.error('❌ File upload test failed:', error);
    return false;
  }
}

async function testRealtimeFeatures() {
  console.log('\n🔍 Testing Realtime Features...');
  
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Test channel subscription
    const channel = supabase.channel('test-channel');
    const subscription = channel.subscribe((status) => {
      console.log('Channel status:', status);
    });

    // Wait for subscription
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (subscription.state === 'SUBSCRIBED') {
      console.log('✅ Realtime subscription working');
      channel.unsubscribe();
      return true;
    } else {
      console.error('❌ Failed to establish realtime connection');
      return false;
    }
  } catch (error) {
    console.error('❌ Realtime test failed:', error);
    return false;
  }
}

async function testAuthFlow() {
  console.log('\n🔍 Testing Authentication Flow...');
  
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Test auth endpoints
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }

    console.log('✅ Auth endpoints accessible');
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return false;
  }
}

async function main() {
  console.log(`🧪 Testing Components in ${process.env.NODE_ENV} environment\n`);
  
  const results = {
    fileUploads: await testFileUploads(),
    realtime: await testRealtimeFeatures(),
    auth: await testAuthFlow()
  };

  console.log('\n📊 Test Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  if (Object.values(results).every(result => result)) {
    console.log('\n✨ All tests passed!');
    process.exit(0);
  } else {
    console.error('\n❌ Some tests failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 