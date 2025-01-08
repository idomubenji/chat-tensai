import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadWindow } from '@/components/ThreadWindow';
import '@testing-library/jest-dom';

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'user1',
    isLoaded: true,
    isSignedIn: true
  })
}));

const mockParentMessage = {
  id: '1',
  content: 'Parent message',
  userId: 'user1',
  userName: 'User One',
  createdAt: new Date().toISOString(),
  reactions: {
    '👍': {
      emoji: '👍',
      userIds: ['user1']
    }
  }
};

const mockReplies = [
  {
    id: '2',
    content: 'First reply',
    userId: 'user2',
    userName: 'User Two',
    createdAt: new Date().toISOString(),
    reactions: {}
  }
];

const mockOnClose = jest.fn();
const mockOnReactionUpdate = jest.fn();
const mockOnSendReply = jest.fn().mockImplementation(() => Promise.resolve());

describe('ThreadWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders parent message and replies', () => {
    render(
      <ThreadWindow
        parentMessage={mockParentMessage}
        replies={mockReplies}
        currentUserId="user1"
        onSendReply={mockOnSendReply}
        onReactionUpdate={mockOnReactionUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Parent message')).toBeInTheDocument();
    expect(screen.getByText('First reply')).toBeInTheDocument();
  });

  it('closes thread window when close button is clicked', () => {
    render(
      <ThreadWindow
        parentMessage={mockParentMessage}
        replies={mockReplies}
        currentUserId="user1"
        onSendReply={mockOnSendReply}
        onReactionUpdate={mockOnReactionUpdate}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close thread');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows sending replies', () => {
    render(
      <ThreadWindow
        parentMessage={mockParentMessage}
        replies={mockReplies}
        currentUserId="user1"
        onSendReply={mockOnSendReply}
        onReactionUpdate={mockOnReactionUpdate}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText('Reply in thread...');
    fireEvent.change(input, { target: { value: 'New reply' } });
    const form = input.closest('form');
    fireEvent.submit(form!);

    expect(mockOnSendReply).toHaveBeenCalledWith('New reply');
  });

  it('shows emoji reaction options on hover', () => {
    render(
      <ThreadWindow
        parentMessage={mockParentMessage}
        replies={mockReplies}
        currentUserId="user1"
        onSendReply={mockOnSendReply}
        onReactionUpdate={mockOnReactionUpdate}
        onClose={mockOnClose}
      />
    );

    const message = screen.getByText('Parent message');
    fireEvent.mouseEnter(message.parentElement!);

    const reactionButtons = screen.getAllByTitle('Add reaction');
    expect(reactionButtons[0]).toBeInTheDocument();
  });
}); 