import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageReactions } from '@/components/MessageReactions';
import '@testing-library/jest-dom';

// Mock emoji-mart modules
jest.mock('@emoji-mart/data', () => ({}));
jest.mock('@emoji-mart/react', () => ({
  __esModule: true,
  default: ({ onEmojiSelect }: { onEmojiSelect: (emoji: any) => void }) => (
    <div data-testid="emoji-picker">
      <button
        onClick={() => onEmojiSelect({ native: '👍' })}
        data-testid="mock-emoji"
      >
        👍
      </button>
    </div>
  ),
}));

describe('MessageReactions', () => {
  const mockMessageId = 'msg1';
  const mockCurrentUserId = 'user1';
  const mockOnReactionSelect = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reaction button correctly', () => {
    render(
      <MessageReactions
        messageId={mockMessageId}
        currentUserId={mockCurrentUserId}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    const button = screen.getByTitle('Add reaction');
    expect(button).toBeInTheDocument();
  });

  it('opens emoji picker on button click', () => {
    render(
      <MessageReactions
        messageId={mockMessageId}
        currentUserId={mockCurrentUserId}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
  });

  it('calls onReactionSelect when emoji is selected', async () => {
    render(
      <MessageReactions
        messageId={mockMessageId}
        currentUserId={mockCurrentUserId}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    // Open the picker
    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    // Click the mock emoji
    const emojiButton = screen.getByTestId('mock-emoji');
    fireEvent.click(emojiButton);

    await waitFor(() => {
      expect(mockOnReactionSelect).toHaveBeenCalledWith(mockMessageId, '👍');
    });
  });

  it('closes picker after emoji selection', async () => {
    render(
      <MessageReactions
        messageId={mockMessageId}
        currentUserId={mockCurrentUserId}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    // Open the picker
    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    // Click the mock emoji
    const emojiButton = screen.getByTestId('mock-emoji');
    fireEvent.click(emojiButton);

    await waitFor(() => {
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
    });
  });

  it('respects align prop for popover positioning', () => {
    render(
      <MessageReactions
        messageId={mockMessageId}
        currentUserId={mockCurrentUserId}
        onReactionSelect={mockOnReactionSelect}
        align="end"
      />
    );

    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    const popoverContent = screen.getByTestId('emoji-picker').closest('[data-align]');
    expect(popoverContent).toHaveAttribute('data-align', 'end');
  });
}); 