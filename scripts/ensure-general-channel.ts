import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: envFile });

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
    console.log('Checking for #general channel...');
    const { data: existingChannel, error: channelCheckError } = await supabase
      .from('channels')
      .select('*')
      .or('name.eq.general,name.eq.#general')
      .single();

    if (channelCheckError && channelCheckError.code !== 'PGRST116') {
      throw channelCheckError;
    }

    if (!existingChannel) {
      console.log('Creating #general channel...');
      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert({
          name: '#general',
          description: 'General discussion channel'
        })
        .select()
        .single();

      if (createError) throw createError;
      console.log('Created #general channel with ID:', newChannel.id);
    } else {
      // Update the name if needed
      if (existingChannel.name !== '#general') {
        console.log('Updating channel name to #general...');
        const { error: updateError } = await supabase
          .from('channels')
          .update({ name: '#general' })
          .eq('id', existingChannel.id);
        
        if (updateError) throw updateError;
        console.log('Updated channel name to #general');
      } else {
        console.log('#general channel already exists with ID:', existingChannel.id);
      }
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 