import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWindow } from '@/components/ChatWindow';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn()
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ChatWindow - loadMoreMessages', () => {
  const mockChannelId = 'test-channel';
  const mockUserId = 'test-user';
  const mockUser = {
    id: mockUserId,
    name: 'Test User',
    avatar_url: 'test-avatar.jpg',
    role: 'USER'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Supabase subscription
    (createClientComponentClient as jest.Mock).mockReturnValue({
      channel: () => ({
        on: () => ({
          subscribe: jest.fn()
        })
      })
    });
  });

  it('should load more messages correctly when scrolling up', async () => {
    // Mock initial messages
    const initialMessages = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${50 - i}`,
      content: `Message ${50 - i}`,
      channel_id: mockChannelId,
      user_id: mockUserId,
      created_at: new Date(2024, 0, 1, 0, i).toISOString(),
      updated_at: new Date(2024, 0, 1, 0, i).toISOString(),
      user: mockUser,
      reactions: {},
      replies: { count: 0 }
    }));

    // Mock older messages that will be loaded
    const olderMessages = Array.from({ length: 30 }, (_, i) => ({
      id: `msg-older-${30 - i}`,
      content: `Older Message ${30 - i}`,
      channel_id: mockChannelId,
      user_id: mockUserId,
      created_at: new Date(2023, 11, 31, 23, i).toISOString(),
      updated_at: new Date(2023, 11, 31, 23, i).toISOString(),
      user: mockUser,
      reactions: {},
      replies: { count: 0 }
    }));

    // Setup fetch mocks
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(initialMessages)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(olderMessages)
      }));

    // Render component
    render(
      <ChatWindow
        channelId={mockChannelId}
        onMessageSelect={() => {}}
        selectedMessageId={null}
      />
    );

    // Wait for initial messages to load
    await waitFor(() => {
      expect(screen.getByText('Message 1')).toBeInTheDocument();
    });

    // Find and click "Load More" button
    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    // Verify loading state
    expect(loadMoreButton).toBeDisabled();
    expect(loadMoreButton).toHaveTextContent('Loading...');

    // Wait for older messages to load
    await waitFor(() => {
      expect(screen.getByText('Older Message 1')).toBeInTheDocument();
    });

    // Verify API call
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const secondCallUrl = mockFetch.mock.calls[1][0];
    expect(secondCallUrl).toContain(`/api/channels/${mockChannelId}/messages`);
    expect(secondCallUrl).toContain('before=');
    expect(secondCallUrl).toContain('limit=50');

    // Verify message count
    const messages = screen.getAllByText(/Message|Older Message/);
    expect(messages).toHaveLength(80); // 50 initial + 30 older

    // Verify "Load More" button is still visible since we got less than 50 messages
    expect(screen.getByText('Load More')).toBeInTheDocument();
    expect(screen.getByText('Load More')).not.toBeDisabled();
  });

  it('should handle empty response correctly', async () => {
    // Mock initial messages with just one message
    const initialMessages = [{
      id: 'msg-1',
      content: 'Last Message',
      channel_id: mockChannelId,
      user_id: mockUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: mockUser,
      reactions: {},
      replies: { count: 0 }
    }];

    // Setup fetch mocks
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(initialMessages)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]) // Empty response for older messages
      }));

    // Render component
    render(
      <ChatWindow
        channelId={mockChannelId}
        onMessageSelect={() => {}}
        selectedMessageId={null}
      />
    );

    // Wait for initial message to load
    await waitFor(() => {
      expect(screen.getByText('Last Message')).toBeInTheDocument();
    });

    // Find and click "Load More" button
    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    // Verify only the initial message is shown
    const messages = screen.getAllByText(/Message/);
    expect(messages).toHaveLength(1);
  });

  it('should handle API errors gracefully', async () => {
    // Mock initial messages
    const initialMessages = [{
      id: 'msg-1',
      content: 'Initial Message',
      channel_id: mockChannelId,
      user_id: mockUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: mockUser,
      reactions: {},
      replies: { count: 0 }
    }];

    // Setup fetch mocks
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(initialMessages)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 500
      }));

    // Mock console.error to prevent error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Render component
    render(
      <ChatWindow
        channelId={mockChannelId}
        onMessageSelect={() => {}}
        selectedMessageId={null}
      />
    );

    // Wait for initial message to load
    await waitFor(() => {
      expect(screen.getByText('Initial Message')).toBeInTheDocument();
    });

    // Find and click "Load More" button
    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    // Wait for loading to complete
    await waitFor(() => {
      expect(loadMoreButton).not.toBeDisabled();
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error loading more messages:',
      expect.any(Error)
    );

    // Verify initial message is still shown
    expect(screen.getByText('Initial Message')).toBeInTheDocument();

    // Clean up
    consoleSpy.mockRestore();
  });
}); 