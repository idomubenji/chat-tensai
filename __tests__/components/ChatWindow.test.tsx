import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWindow } from '@/components/ChatWindow';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// Mock useSupabaseAuth hook
jest.mock('@/hooks/useSupabaseAuth');

describe('ChatWindow', () => {
  const mockMessages = [
    {
      id: '1',
      content: 'Test message 1',
      created_at: new Date().toISOString(),
      user_id: 'test-user-id',
      channel_id: 'test-channel',
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
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
        json: () => Promise.resolve({ message: 'Message sent' })
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders messages correctly', () => {
    render(
      <ChatWindow
        channelId="test-channel"
        onMessageSelect={jest.fn()}
        selectedMessageId={null}
      />
    );

    expect(screen.getByText('Test message 1')).toBeInTheDocument();
  });

  it('allows sending new messages', async () => {
    render(
      <ChatWindow
        channelId="test-channel"
        onMessageSelect={jest.fn()}
        selectedMessageId={null}
      />
    );

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'New test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/channels/test-channel/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'New test message' })
        })
      );
    });
  });

  it('handles message selection', () => {
    const mockOnMessageSelect = jest.fn();
    render(
      <ChatWindow
        channelId="test-channel"
        onMessageSelect={mockOnMessageSelect}
        selectedMessageId={null}
      />
    );

    const message = screen.getByText('Test message 1');
    fireEvent.click(message);

    expect(mockOnMessageSelect).toHaveBeenCalledWith('1');
  });

  it('highlights selected message', () => {
    render(
      <ChatWindow
        channelId="test-channel"
        onMessageSelect={jest.fn()}
        selectedMessageId="1"
      />
    );

    const message = screen.getByText('Test message 1').closest('.message');
    expect(message).toHaveClass('selected');
  });
}); 