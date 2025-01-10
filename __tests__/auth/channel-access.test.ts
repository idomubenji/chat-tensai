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

describe('Channel Access', () => {
  let testUserId: string;
  let testUserClient: ReturnType<typeof createClient<Database>>;
  let testUserEmail: string;

  beforeAll(async () => {
    // Clean up any existing test users
    const { error: cleanupError } = await supabase
      .from('users')
      .delete()
      .like('email', 'test%@example.com');
    
    if (cleanupError) throw cleanupError;

    // Create test user
    testUserEmail = `test${Date.now()}@example.com`;
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: { username: 'testuser' }
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    testUserId = userData.user!.id;

    // Wait for user to be created in public.users
    const userCreated = await waitForUser(testUserId);
    expect(userCreated).toBe(true);

    // Create authenticated client for test user
    testUserClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Sign in as test user
    const { error: signInError } = await testUserClient.auth.signInWithPassword({
      email: testUserEmail,
      password: 'testpassword123'
    });

    expect(signInError).toBeNull();
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

  test('authenticated user can create a channel', async () => {
    const channelName = `test-channel-${Date.now()}`;
    
    // Create channel
    const { data: channel, error: createError } = await testUserClient
      .from('channels')
      .insert({
        name: channelName,
        description: 'Test channel',
        created_by_id: testUserId
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(channel).toMatchObject({
      name: channelName,
      description: 'Test channel',
      created_by_id: testUserId
    });

    // Clean up
    await supabase
      .from('channels')
      .delete()
      .eq('id', channel.id);
  }, 10000); // Increase timeout for channel creation

  test('authenticated user can create and read messages', async () => {
    const channelName = `test-channel-${Date.now()}`;
    
    // Create channel
    const { data: channel, error: createError } = await testUserClient
      .from('channels')
      .insert({
        name: channelName,
        description: 'Test channel',
        created_by_id: testUserId
      })
      .select()
      .single();

    expect(createError).toBeNull();

    // Create message
    const messageContent = 'Test message';
    const { data: message, error: messageError } = await testUserClient
      .from('messages')
      .insert({
        channel_id: channel.id,
        user_id: testUserId,
        content: messageContent
      })
      .select()
      .single();

    expect(messageError).toBeNull();
    expect(message).toMatchObject({
      channel_id: channel.id,
      user_id: testUserId,
      content: messageContent
    });

    // Read message
    const { data: readMessage, error: readError } = await testUserClient
      .from('messages')
      .select()
      .eq('id', message.id)
      .single();

    expect(readError).toBeNull();
    expect(readMessage).toMatchObject({
      channel_id: channel.id,
      user_id: testUserId,
      content: messageContent
    });

    // Clean up
    await supabase
      .from('channels')
      .delete()
      .eq('id', channel.id);
  }, 10000); // Increase timeout for message tests

  test('authenticated user can add and remove reactions', async () => {
    const channelName = `test-channel-${Date.now()}`;
    
    // Create channel
    const { data: channel, error: createError } = await testUserClient
      .from('channels')
      .insert({
        name: channelName,
        description: 'Test channel',
        created_by_id: testUserId
      })
      .select()
      .single();

    expect(createError).toBeNull();

    // Create message
    const { data: message, error: messageError } = await testUserClient
      .from('messages')
      .insert({
        channel_id: channel.id,
        user_id: testUserId,
        content: 'Test message'
      })
      .select()
      .single();

    expect(messageError).toBeNull();

    // Add reaction
    const { data: reaction, error: reactionError } = await testUserClient
      .from('message_reactions')
      .insert({
        message_id: message.id,
        user_id: testUserId,
        emoji: '👍'
      })
      .select()
      .single();

    expect(reactionError).toBeNull();
    expect(reaction).toMatchObject({
      message_id: message.id,
      user_id: testUserId,
      emoji: '👍'
    });

    // Remove reaction
    const { error: deleteError } = await testUserClient
      .from('message_reactions')
      .delete()
      .eq('id', reaction.id);

    expect(deleteError).toBeNull();

    // Verify reaction is gone
    const { data: reactions, error: verifyError } = await testUserClient
      .from('message_reactions')
      .select()
      .eq('id', reaction.id);

    expect(verifyError).toBeNull();
    expect(reactions).toHaveLength(0);

    // Clean up
    await supabase
      .from('channels')
      .delete()
      .eq('id', channel.id);
  }, 10000); // Increase timeout for reaction tests
}); 