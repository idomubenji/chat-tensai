import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

const isTest = process.env.NODE_ENV === 'test' || process.argv.includes('test-db.ts');

// Create the appropriate client based on environment
const createSupabaseClient = () => {
  if (isTest) {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  // For normal operation, use the Next.js auth helper
  return createClientComponentClient<Database>();
};

// User operations
export const getUser = async (id: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, userData: Database['public']['Tables']['users']['Update']) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Channel operations
export const createChannel = async (channelData: Database['public']['Tables']['channels']['Insert']) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('channels')
    .insert(channelData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getChannel = async (id: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Message operations
export const createMessage = async (messageData: Database['public']['Tables']['messages']['Insert']) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getChannelMessages = async (channelId: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      user:users!messages_user_id_fkey(*),
      reactions:message_reactions(*),
      files(*)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Message reaction operations
export const addReaction = async (reactionData: Database['public']['Tables']['message_reactions']['Insert']) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('message_reactions')
    .insert(reactionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const removeReaction = async (messageId: string, userId: string, emoji: string) => {
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .match({ message_id: messageId, user_id: userId, emoji });
  
  if (error) throw error;
};
