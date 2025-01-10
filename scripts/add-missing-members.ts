import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

const GENERAL_CHANNEL_ID = 'ee770d6a-3014-4789-ac4c-34d022a0f0f5';

async function main() {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) throw usersError;

    // Get existing members
    const { data: existingMembers, error: membersError } = await supabase
      .from('channel_members')
      .select('user_id')
      .eq('channel_id', GENERAL_CHANNEL_ID);
    
    if (membersError) throw membersError;

    const existingMemberIds = new Set(existingMembers.map(m => m.user_id));
    const usersToAdd = users.filter(user => !existingMemberIds.has(user.id));

    console.log(`Found ${usersToAdd.length} users to add to #general:`);
    usersToAdd.forEach(user => {
      console.log(`- ${user.name} (${user.id})`);
    });

    if (usersToAdd.length > 0) {
      // Add missing users to the channel
      const { error: insertError } = await supabase
        .from('channel_members')
        .insert(
          usersToAdd.map(user => ({
            channel_id: GENERAL_CHANNEL_ID,
            user_id: user.id,
            role_in_channel: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
          }))
        );

      if (insertError) throw insertError;
      console.log('\nSuccessfully added users to #general');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 