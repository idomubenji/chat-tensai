import { createClient } from '@supabase/supabase-js';
import { AdminUserAttributes } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Helper function to wait for user to be created
async function waitForUser(userId: string, maxAttempts = 5): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select()
        .eq('id', userId);
      
      if (error) {
        console.error(`Error checking user (attempt ${i + 1}):`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      if (users && users.length > 0) {
        return true;
      }
      
      console.log(`User not found (attempt ${i + 1}), waiting...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Unexpected error checking user (attempt ${i + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return false;
}

describe('User Synchronization', () => {
  let createdUserId: string;
  let generalChannelId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Create an admin user first
    const adminEmail = `admin${Date.now()}@example.com`;
    const { data: adminUserData, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: 'adminpass123',
      email_confirm: true,
      user_metadata: {
        username: 'Admin User'
      }
    });

    if (adminError) {
      console.error('Error creating admin user:', adminError);
      throw adminError;
    }

    adminUserId = adminUserData.user!.id;

    // Wait for admin user to be created in public.users
    const adminCreated = await waitForUser(adminUserId);
    if (!adminCreated) {
      throw new Error('Failed to create admin user');
    }

    // Set admin role
    const { error: roleError } = await supabase
      .from('users')
      .update({ role: 'ADMIN' })
      .eq('id', adminUserId);

    if (roleError) {
      console.error('Error setting admin role:', roleError);
      throw roleError;
    }

    // Delete existing general channel if it exists
    const { data: existingChannel } = await supabase
      .from('channels')
      .select()
      .eq('name', 'general')
      .single();

    if (existingChannel) {
      await supabase
        .from('channels')
        .delete()
        .eq('id', existingChannel.id);
    }

    // Create a general channel for testing
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        name: 'general',
        description: 'Test general channel',
        created_by_id: adminUserId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating general channel:', error);
      throw error;
    }
    
    if (!channel) {
      throw new Error('Failed to create general channel');
    }
    
    generalChannelId = channel.id;
    console.log('Created general channel with ID:', generalChannelId);
  });

  afterEach(async () => {
    // Clean up test user if created
    if (createdUserId) {
      console.log('Cleaning up user:', createdUserId);
      try {
        await supabase.auth.admin.deleteUser(createdUserId);
      } catch (error) {
        console.error('Error deleting auth user:', error);
      }
      
      try {
        await supabase.from('users').delete().eq('id', createdUserId);
      } catch (error) {
        console.error('Error deleting public user:', error);
      }
      
      createdUserId = '';
    }
  });

  afterAll(async () => {
    // Clean up general channel
    if (generalChannelId) {
      console.log('Cleaning up general channel:', generalChannelId);
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', generalChannelId);
      
      if (error) {
        console.error('Error deleting general channel:', error);
      }
    }

    // Clean up admin user
    if (adminUserId) {
      console.log('Cleaning up admin user:', adminUserId);
      try {
        await supabase.auth.admin.deleteUser(adminUserId);
      } catch (error) {
        console.error('Error deleting admin auth user:', error);
      }
      
      try {
        await supabase.from('users').delete().eq('id', adminUserId);
      } catch (error) {
        console.error('Error deleting admin public user:', error);
      }
    }
  });

  test('creates user in public.users when added to auth.users', async () => {
    const email = `test${Date.now()}@example.com`;
    console.log('Testing with email:', email);
    
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        username: 'Test User'
      }
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    createdUserId = userData.user!.id;
    console.log('Created auth user with ID:', createdUserId);

    // Wait for user to be created
    const userCreated = await waitForUser(createdUserId);
    expect(userCreated).toBe(true);

    // Check if user exists in public.users
    const { data: publicUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', createdUserId)
      .single();

    expect(fetchError).toBeNull();
    expect(publicUser).not.toBeNull();
    expect(publicUser?.email).toBe(email);
  });

  test('adds user to general channel', async () => {
    const email = `test${Date.now()}@example.com`;
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    createdUserId = userData.user!.id;

    // Wait for user to be created
    const userCreated = await waitForUser(createdUserId);
    expect(userCreated).toBe(true);

    // Check if user is added to general channel
    const { data: channelMember, error: memberError } = await supabase
      .from('channel_members')
      .select()
      .eq('user_id', createdUserId)
      .eq('channel_id', generalChannelId)
      .single();

    expect(memberError).toBeNull();
    expect(channelMember).not.toBeNull();
  });

  test('uses email as username when no name provided', async () => {
    const email = `test${Date.now()}@example.com`;
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    createdUserId = userData.user!.id;

    // Wait for user to be created
    const userCreated = await waitForUser(createdUserId);
    expect(userCreated).toBe(true);

    // Check if user's name is set to email
    const { data: publicUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', createdUserId)
      .single();

    expect(fetchError).toBeNull();
    expect(publicUser).not.toBeNull();
    expect(publicUser?.name).toBe(email);
  });

  test('uses provided name from metadata', async () => {
    const email = `test${Date.now()}@example.com`;
    const name = 'Test User';
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: { name }
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    createdUserId = userData.user!.id;

    // Wait for user to be created
    const userCreated = await waitForUser(createdUserId);
    expect(userCreated).toBe(true);

    // Check if user's name is set from metadata
    const { data: publicUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', createdUserId)
      .single();

    expect(fetchError).toBeNull();
    expect(publicUser).not.toBeNull();
    expect(publicUser?.name).toBe(name);
  });

  test('prevents duplicate entries in public.users', async () => {
    const email = `test${Date.now()}@example.com`;
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    createdUserId = userData.user!.id;

    // Wait for user to be created
    const userCreated = await waitForUser(createdUserId);
    expect(userCreated).toBe(true);

    // Try to insert the same user manually
    const { error: duplicateError } = await supabase
      .from('users')
      .insert({
        id: createdUserId,
        email,
        name: email
      });

    expect(duplicateError).not.toBeNull();
    expect(duplicateError?.code).toBe('23505'); // Unique violation error code
  });

  test('handles special characters in email addresses', async () => {
    const email = `test+special&chars${Date.now()}@example.com`;
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    createdUserId = userData.user!.id;

    // Wait for user to be created
    const userCreated = await waitForUser(createdUserId);
    expect(userCreated).toBe(true);

    // Check if user exists in public.users with correct email
    const { data: publicUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', createdUserId)
      .single();

    expect(fetchError).toBeNull();
    expect(publicUser).not.toBeNull();
    expect(publicUser?.email).toBe(email);
  });

  test('handles long email addresses and names', async () => {
    const longName = 'A'.repeat(100);
    const email = `test${Date.now()}${'a'.repeat(50)}@${'b'.repeat(50)}.com`;
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: { name: longName }
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    createdUserId = userData.user!.id;

    // Wait for user to be created
    const userCreated = await waitForUser(createdUserId);
    expect(userCreated).toBe(true);

    // Check if user exists in public.users with correct data
    const { data: publicUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', createdUserId)
      .single();

    expect(fetchError).toBeNull();
    expect(publicUser).not.toBeNull();
    expect(publicUser?.email).toBe(email);
    expect(publicUser?.name).toBe(longName);
  });

  test('handles complex metadata objects', async () => {
    const email = `test${Date.now()}@example.com`;
    const metadata = {
      name: 'Complex User',
      preferences: {
        theme: 'dark',
        notifications: true
      },
      tags: ['test', 'user']
    };

    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: metadata
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    createdUserId = userData.user!.id;

    const userCreated = await waitForUser(createdUserId);
    expect(userCreated).toBe(true);

    const { data: publicUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', createdUserId)
      .single();

    expect(fetchError).toBeNull();
    expect(publicUser).not.toBeNull();
    expect(publicUser?.name).toBe(metadata.name);
  });

  test('handles concurrent user creation', async () => {
    const numUsers = 5;
    const users = Array.from({ length: numUsers }, (_, i) => ({
      email: `concurrent${Date.now()}_${i}@example.com`,
      password: 'testpassword123'
    }));

    const createdUserIds: string[] = [];

    // Create users concurrently
    const results = await Promise.all(
      users.map(user =>
        supabase.auth.admin.createUser({
          ...user,
          email_confirm: true
        })
      )
    );

    // Check for errors and collect user IDs
    results.forEach(({ data, error }, index) => {
      expect(error).toBeNull();
      expect(data.user).not.toBeNull();
      createdUserIds.push(data.user!.id);
    });

    // Wait for all users to be created
    const creationResults = await Promise.all(
      createdUserIds.map(id => waitForUser(id))
    );

    // Check if all users were created successfully
    creationResults.forEach((created, index) => {
      expect(created).toBe(true);
    });

    // Clean up created users
    await Promise.all(
      createdUserIds.map(async (id) => {
        try {
          await supabase.auth.admin.deleteUser(id);
          await supabase.from('users').delete().eq('id', id);
        } catch (error) {
          console.error(`Error cleaning up user ${id}:`, error);
        }
      })
    );
  });

  test('handles user deletion cleanup', async () => {
    const email = `delete${Date.now()}@example.com`;
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true
    });

    expect(error).toBeNull();
    expect(userData.user).not.toBeNull();
    const userId = userData.user!.id;

    // Wait for user to be created
    const userCreated = await waitForUser(userId);
    expect(userCreated).toBe(true);

    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    expect(deleteError).toBeNull();

    // Check if user is removed from public.users
    const { data: publicUser, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single();

    expect(publicUser).toBeNull();
    expect(fetchError?.code).toBe('PGRST116'); // Not found error

    // Check if user is removed from channel_members
    const { data: channelMember, error: memberError } = await supabase
      .from('channel_members')
      .select()
      .eq('user_id', userId)
      .single();

    expect(channelMember).toBeNull();
    expect(memberError?.code).toBe('PGRST116'); // Not found error
  });
}); 