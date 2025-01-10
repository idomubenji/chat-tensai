import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThreadWindow } from '@/components/ThreadWindow';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// Mock useSupabaseAuth hook
jest.mock('@/hooks/useSupabaseAuth');

describe('ThreadWindow', () => {
  const mockParentMessage = {
    id: '1',
    content: 'Parent message',
    created_at: new Date().toISOString(),
    user_id: 'test-user-id',
    channel_id: 'test-channel',
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com'
    }
  };

  const mockReplies = [
    {
      id: '2',
      content: 'Reply message',
      created_at: new Date().toISOString(),
      user_id: 'test-user-id-2',
      parent_id: '1',
      user: {
        id: 'test-user-id-2',
        name: 'Test User 2',
        email: 'test2@example.com'
      }
    }
  ];

  beforeEach(() => {
    (useSupabaseAuth as jest.Mock).mockReturnValue({
      userId: 'test-user-id',
      isLoaded: true,
      isSignedIn: true
    });

    // Mock fetch for message sending
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Reply sent' })
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders parent message and replies correctly', () => {
    render(
      <ThreadWindow
        messageId="1"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Parent message')).toBeInTheDocument();
    expect(screen.getByText('Reply message')).toBeInTheDocument();
  });

  it('allows sending replies', async () => {
    render(
      <ThreadWindow
        messageId="1"
        onClose={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/reply to thread/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'New reply' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/messages/1/replies',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'New reply' })
        })
      );
    });
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <ThreadWindow
        messageId="1"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
}); 