import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChannelList } from '@/components/ChannelList';
import '@testing-library/jest-dom';

// Mock data
const mockChannels = [
  { id: '1', name: 'general' },
  { id: '2', name: 'random' },
];

// Mock functions
const mockOnSelectChannel = jest.fn();
const mockOnAddChannel = jest.fn();

describe('ChannelList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders channels correctly', () => {
    render(
      <ChannelList
        channels={mockChannels}
        onSelectChannel={mockOnSelectChannel}
        onAddChannel={mockOnAddChannel}
      />
    );

    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('random')).toBeInTheDocument();
  });

  it('calls onSelectChannel when a channel is clicked', () => {
    render(
      <ChannelList
        channels={mockChannels}
        onSelectChannel={mockOnSelectChannel}
        onAddChannel={mockOnAddChannel}
      />
    );

    fireEvent.click(screen.getByText('general'));
    expect(mockOnSelectChannel).toHaveBeenCalledWith('1');
  });

  it('opens dialog when Add Channel button is clicked', () => {
    render(
      <ChannelList
        channels={mockChannels}
        onSelectChannel={mockOnSelectChannel}
        onAddChannel={mockOnAddChannel}
      />
    );

    fireEvent.click(screen.getByText('Add Channel'));
    expect(screen.getByText('Create New Channel')).toBeInTheDocument();
  });

  it('shows error when trying to add empty channel name', () => {
    render(
      <ChannelList
        channels={mockChannels}
        onSelectChannel={mockOnSelectChannel}
        onAddChannel={mockOnAddChannel}
      />
    );

    fireEvent.click(screen.getByText('Add Channel'));
    const submitButton = screen.getByText('Create Channel');
    fireEvent.click(submitButton);

    expect(screen.getByText('hey, there\'s nothing in the text box, don\'t you try and get away with that')).toBeInTheDocument();
  });

  it('shows error when trying to add duplicate channel name', () => {
    render(
      <ChannelList
        channels={mockChannels}
        onSelectChannel={mockOnSelectChannel}
        onAddChannel={mockOnAddChannel}
      />
    );

    fireEvent.click(screen.getByText('Add Channel'));
    const input = screen.getByPlaceholderText('Enter channel name');
    fireEvent.change(input, { target: { value: 'general' } });
    const submitButton = screen.getByText('Create Channel');
    fireEvent.click(submitButton);

    expect(screen.getByText('we already have a channel with that name young man')).toBeInTheDocument();
  });

  it('successfully adds a new channel', () => {
    render(
      <ChannelList
        channels={mockChannels}
        onSelectChannel={mockOnSelectChannel}
        onAddChannel={mockOnAddChannel}
      />
    );

    fireEvent.click(screen.getByText('Add Channel'));
    const input = screen.getByPlaceholderText('Enter channel name');
    fireEvent.change(input, { target: { value: 'new-channel' } });
    const submitButton = screen.getByText('Create Channel');
    fireEvent.click(submitButton);

    expect(mockOnAddChannel).toHaveBeenCalledWith('new-channel');
  });

  it('disables Add Channel button when maximum channels reached', () => {
    const maxChannels = Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      name: `channel-${i + 1}`,
    }));

    render(
      <ChannelList
        channels={maxChannels}
        onSelectChannel={mockOnSelectChannel}
        onAddChannel={mockOnAddChannel}
      />
    );

    const addButton = screen.getByText('Add Channel').closest('button');
    expect(addButton).toBeDisabled();
  });
}); 