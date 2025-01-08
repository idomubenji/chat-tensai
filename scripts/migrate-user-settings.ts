import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addUserSettings() {
  try {
    console.log('Adding user settings columns...');
    
    // Add bio column
    const { error: bioError } = await supabase
      .from('users')
      .update({ bio: null })
      .eq('id', 'dummy')
      .select();
    
    if (bioError && !bioError.message.includes('column "bio" does not exist')) {
      throw bioError;
    }

    // Add status_message column
    const { error: statusMessageError } = await supabase
      .from('users')
      .update({ status_message: null })
      .eq('id', 'dummy')
      .select();
    
    if (statusMessageError && !statusMessageError.message.includes('column "status_message" does not exist')) {
      throw statusMessageError;
    }

    // Add status_emoji column
    const { error: statusEmojiError } = await supabase
      .from('users')
      .update({ status_emoji: null })
      .eq('id', 'dummy')
      .select();
    
    if (statusEmojiError && !statusEmojiError.message.includes('column "status_emoji" does not exist')) {
      throw statusEmojiError;
    }

    console.log('Successfully added user settings columns!');
  } catch (error) {
    console.error('Failed to add user settings:', error);
    process.exit(1);
  }
}

addUserSettings(); 