import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWindow } from '@/components/ChatWindow';
import '@testing-library/jest-dom';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'user1',
    isLoaded: true,
    isSignedIn: true
  })
}));

const mockMessages = [
  {
    id: '1',
    content: 'Hello',
    userId: 'user1',
    userName: 'User One',
    createdAt: '2023-01-01T09:23:09.000Z',
    updatedAt: '2023-01-01T09:23:09.000Z',
    reactions: {},
    replies: []
  }
];

const mockOnSendMessage = jest.fn().mockImplementation(() => Promise.resolve());
const mockOnReactionUpdate = jest.fn();
const mockOnMessageUpdate = jest.fn();
const mockOnSelectMessage = jest.fn();

describe('ChatWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders messages correctly', async () => {
    render(
      <ChatWindow
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onReactionUpdate={mockOnReactionUpdate}
        onMessageUpdate={mockOnMessageUpdate}
        selectedMessage={null}
        onSelectMessage={mockOnSelectMessage}
        channelId="test-channel"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('4:23:09 AM')).toBeInTheDocument();
    });
  });

  it('allows sending new messages', async () => {
    render(
      <ChatWindow
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onReactionUpdate={mockOnReactionUpdate}
        onMessageUpdate={mockOnMessageUpdate}
        selectedMessage={null}
        onSelectMessage={mockOnSelectMessage}
        channelId="test-channel"
      />
    );

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'New message' } });
      const form = input.closest('form');
      fireEvent.submit(form!);
    });

    expect(mockOnSendMessage).toHaveBeenCalledWith('New message');
  });

  it('shows emoji reaction options on hover', async () => {
    render(
      <ChatWindow
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onReactionUpdate={mockOnReactionUpdate}
        onMessageUpdate={mockOnMessageUpdate}
        selectedMessage={null}
        onSelectMessage={mockOnSelectMessage}
        channelId="test-channel"
      />
    );

    await waitFor(() => {
      const message = screen.getByText('Hello');
      fireEvent.mouseEnter(message.parentElement!);
    });

    const reactionButtons = screen.getAllByTitle('Add reaction');
    expect(reactionButtons[0]).toBeInTheDocument();
  });
}); 