import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../types/supabase';
import { LIT_PREFIX, literaryDebateMessages } from './literary-debate-messages';

// Load environment variables
dotenv.config({ path: '.env.development' });

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('Debug Info:');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key (first 10 chars):', serviceRoleKey?.slice(0, 10) + '...');

const supabase = createClient<Database>(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Test connection
async function testConnection() {
  try {
    console.log('\nTesting Supabase connection...');
    const { data, error } = await supabase.from('users').select('count').single();
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    console.log('Connection test successful:', data);
    return true;
  } catch (error) {
    console.error('Connection test threw an error:', error);
    return false;
  }
}

const literaryUsers = [
  {
    id: `${LIT_PREFIX}dubbagunga`,
    name: 'Dubbagunga',
    email: 'dubbagunga@chat-tensai.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${LIT_PREFIX}kurakami`,
    name: 'Kurakami',
    email: 'kurakami@chat-tensai.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${LIT_PREFIX}rustaf`,
    name: 'Rustaf',
    email: 'rustaf@chat-tensai.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  },
  {
    id: `${LIT_PREFIX}slicktrigga`,
    name: 'SlickTrigga',
    email: 'slicktrigga@chat-tensai.local',
    avatar_url: null,
    status: 'ONLINE' as const,
    role: 'USER' as const
  }
];

async function main() {
  try {
    console.log('=== Starting literary debate seeding ===\n');

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to establish connection to Supabase. Exiting...');
      process.exit(1);
    }

    // Create users
    console.log('\nCreating literary debate users...');
    for (const user of literaryUsers) {
      console.log(`\nAttempting to create/check user: ${user.name}`);
      
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .single();

      if (checkError) {
        console.log('Check error details:', {
          code: checkError.code,
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint
        });
        
        if (checkError.code !== 'PGRST116') {
          throw checkError;
        }
      }

      if (!existingUser) {
        console.log('User does not exist, attempting to create...');
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert(user)
          .select()
          .single();

        if (createError) {
          console.error('Create error details:', {
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint
          });
          throw createError;
        }
        console.log('Created user:', newUser.name, 'with ID:', newUser.id);
      } else {
        console.log('User already exists:', existingUser.name, 'with ID:', existingUser.id);
      }
    }

    // Create or get general channel
    console.log('\nGetting or creating #general channel...');
    const { data: existingChannel, error: checkError } = await supabase
      .from('channels')
      .select('*')
      .eq('name', '#general')
      .single();

    let generalChannel;
    if (checkError && checkError.code === 'PGRST116') {
      console.log('Creating #general channel...');
      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert({
          name: '#general',
          description: 'General discussion channel',
          created_by_id: `${LIT_PREFIX}dubbagunga`
        })
        .select()
        .single();

      if (createError) throw createError;
      console.log('Created #general channel');
      generalChannel = newChannel;
    } else if (checkError) {
      throw checkError;
    } else {
      console.log('Found existing #general channel');
      generalChannel = existingChannel;
    }

    // Add messages
    console.log('\nAdding literary debate messages to #general...');
    for (const message of literaryDebateMessages) {
      const { data: existingMessage, error: checkError } = await supabase
        .from('messages')
        .select()
        .eq('channel_id', generalChannel.id)
        .eq('user_id', message.userId)
        .eq('content', message.content)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing message:', checkError);
        throw checkError;
      }

      if (!existingMessage) {
        const { data: newMessage, error: createError } = await supabase
          .from('messages')
          .insert({
            channel_id: generalChannel.id,
            user_id: message.userId,
            content: message.content
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating message:', createError);
          throw createError;
        }
        console.log(`Added message from ${message.userId}: ${message.content.slice(0, 30)}...`);
      } else {
        console.log(`Message already exists from ${message.userId}: ${message.content.slice(0, 30)}...`);
      }
    }

    console.log('\n=== Literary debate seeding completed successfully! ===');
  } catch (error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

main(); 