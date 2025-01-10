import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '@/types/supabase';

dotenv.config({ path: '.env.test.local' });

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to wait for user to be created
async function waitForUser(userId: string, maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single();
    
    if (data) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

// Helper to get all channels
async function getAllChannels() {
  const { data: channels, error } = await supabase
    .from('channels')
    .select('*');
  
  if (error) throw error;
  return channels;
}

describe('User Synchronization', () => {
  let testUserId: string;
  let testUserEmail: string;
  let generalChannelId: string;

  beforeAll(async () => {
    // Clean up any existing test users
    const { error: cleanupError } = await supabase
      .from('users')
      .delete()
      .like('email', 'test%@example.com');
    
    if (cleanupError) throw cleanupError;

    // Ensure general channel exists
    const { data: channel, error } = await supabase
      .from('channels')
      .select()
      .or('name.eq.general,name.eq.#general')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!channel) {
      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert({
          name: '#general',
          description: 'General discussion channel',
          created_by_id: 'system'
        })
        .select()
        .single();

      if (createError) throw createError;
      generalChannelId = newChannel.id;
    } else {
      generalChannelId = channel.id;
    }
  }, 10000); // Increase timeout for setup

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
      await supabase
        .from('users')
        .delete()
        .eq('id', testUserId);
    }
  }, 10000); // Increase timeout for cleanup

  test('creates user in public.users table with correct fields', async () => {
    testUserEmail = `test${Date.now()}@example.com`;
    const username = 'testuser';
    
    // Create auth user
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: { username }
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    testUserId = userData.user!.id;

    // Wait for user to be created in public.users
    const userCreated = await waitForUser(testUserId);
    expect(userCreated).toBe(true);

    // Verify user fields
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', testUserId)
      .single();

    expect(fetchError).toBeNull();
    expect(user).toMatchObject({
      id: testUserId,
      email: testUserEmail,
      name: username,
      avatar_url: null,
      role: 'USER'
    });
  }, 10000); // Increase timeout for user creation

  test('authenticated user can access all channels', async () => {
    // Get all channels
    const channels = await getAllChannels();
    expect(channels.length).toBeGreaterThan(0);

    // Create a test client with the user's auth
    const userClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Sign in as the test user
    const { error: signInError } = await userClient.auth.signInWithPassword({
      email: testUserEmail,
      password: 'testpassword123'
    });

    expect(signInError).toBeNull();

    // Verify the user can read all channels
    const { data: accessibleChannels, error: channelsError } = await userClient
      .from('channels')
      .select('*');

    expect(channelsError).toBeNull();
    expect(accessibleChannels).toHaveLength(channels.length);

    // Verify the user can read messages in each channel
    for (const channel of channels) {
      const { error: messagesError } = await userClient
        .from('messages')
        .select()
        .eq('channel_id', channel.id)
        .limit(1);

      expect(messagesError).toBeNull();
    }
  }, 10000); // Increase timeout for channel access

  test('handles duplicate user creation gracefully', async () => {
    const email = `test${Date.now()}@example.com`;
    
    // Create first user
    const { data: user1 } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true
    });

    // Try to create duplicate user
    const { error: duplicateError } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true
    });

    expect(duplicateError).not.toBeNull();
    
    // Clean up
    if (user1.user) {
      await supabase.auth.admin.deleteUser(user1.user.id);
    }
  }, 10000); // Increase timeout for duplicate user test

  test('syncs user data on subsequent logins', async () => {
    const email = `test${Date.now()}@example.com`;
    const initialUsername = 'initial';
    const updatedUsername = 'updated';
    
    // Create initial user
    const { data: userData } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: { username: initialUsername }
    });

    const userId = userData.user!.id;
    await waitForUser(userId);

    // Update username and trigger sync by updating the user directly
    const { error: updateError } = await supabase
      .from('users')
      .update({ name: updatedUsername })
      .eq('id', userId);

    expect(updateError).toBeNull();

    // Get all channels
    const channels = await getAllChannels();
    expect(channels.length).toBeGreaterThan(0);

    // Create a test client with the user's auth
    const userClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Sign in as the test user
    const { error: signInError } = await userClient.auth.signInWithPassword({
      email,
      password: 'testpassword123'
    });

    expect(signInError).toBeNull();

    // Verify the user can still access all channels
    const { data: accessibleChannels, error: channelsError } = await userClient
      .from('channels')
      .select('*');

    expect(channelsError).toBeNull();
    expect(accessibleChannels).toHaveLength(channels.length);

    // Clean up
    await supabase.auth.admin.deleteUser(userId);
  }, 10000); // Increase timeout for sync test
}); 