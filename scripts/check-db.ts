import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function main() {
  try {
    // Check users
    console.log('\nChecking users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) throw usersError;
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.id})`);
    });

    // Check channels
    console.log('\nChecking channels...');
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*');
    
    if (channelsError) throw channelsError;
    console.log(`Found ${channels.length} channels:`);
    channels.forEach(channel => {
      console.log(`- ${channel.name} (${channel.id})`);
    });

    // Check messages
    console.log('\nChecking messages...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        channel:channels!inner(*),
        user:users!inner(*)
      `);
    
    if (messagesError) throw messagesError;
    console.log(`Found ${messages.length} messages:`);
    messages.forEach(message => {
      console.log(`- [${message.channel.name}] ${message.user.name}: ${message.content}`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 