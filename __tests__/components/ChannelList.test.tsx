import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChannelList } from '@/components/ChannelList';
import { useRouter } from 'next/navigation';
import { useChannels } from '@/hooks/useChannels';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useChannels hook
jest.mock('@/hooks/useChannels', () => ({
  useChannels: jest.fn(),
}));

describe('ChannelList', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockAddChannel = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Setup useChannels mock with default values
    (useChannels as jest.Mock).mockReturnValue({
      addChannel: mockAddChannel,
    });
  });

  describe('Character limit enforcement', () => {
    it('should not allow more than 25 characters in channel name input', async () => {
      render(<ChannelList channels={[]} isLoading={false} />);

      // Open dialog
      fireEvent.click(screen.getByText('+ ADD CHANNEL'));

      // Get input field
      const input = screen.getByPlaceholderText('Enter channel name...');

      // Type a long string
      fireEvent.change(input, { target: { value: 'a'.repeat(30) } });

      // Check that input value is truncated to 25 characters
      expect(input).toHaveValue('a'.repeat(25));
    });

    it('should show character count', () => {
      render(<ChannelList channels={[]} isLoading={false} />);

      // Open dialog
      fireEvent.click(screen.getByText('+ ADD CHANNEL'));

      // Type some text
      const input = screen.getByPlaceholderText('Enter channel name...');
      fireEvent.change(input, { target: { value: 'test' } });

      // Check character count
      expect(screen.getByText('4/25 characters')).toBeInTheDocument();
    });
  });

  describe('Input validation', () => {
    it('should show error for empty channel name', () => {
      render(<ChannelList channels={[]} isLoading={false} />);

      // Open dialog
      fireEvent.click(screen.getByText('+ ADD CHANNEL'));

      // Type space only
      const input = screen.getByPlaceholderText('Enter channel name...');
      fireEvent.change(input, { target: { value: '   ' } });

      // Check error message
      expect(screen.getByText('Channel name cannot be empty')).toBeInTheDocument();
    });

    it('should show error for invalid characters', () => {
      render(<ChannelList channels={[]} isLoading={false} />);

      // Open dialog
      fireEvent.click(screen.getByText('+ ADD CHANNEL'));

      // Type invalid characters
      const input = screen.getByPlaceholderText('Enter channel name...');
      fireEvent.change(input, { target: { value: 'test@#$%' } });

      // Check error message
      expect(screen.getByText('Channel name can only contain letters, numbers, and spaces')).toBeInTheDocument();
    });
  });

  describe('Channel creation flow', () => {
    it('should create channel and redirect on success', async () => {
      mockAddChannel.mockResolvedValueOnce({ id: '123', name: '#test' });

      render(<ChannelList channels={[]} isLoading={false} />);

      // Open dialog
      fireEvent.click(screen.getByText('+ ADD CHANNEL'));

      // Type valid channel name
      const input = screen.getByPlaceholderText('Enter channel name...');
      fireEvent.change(input, { target: { value: 'test' } });

      // Click Add Channel button
      fireEvent.click(screen.getByText('Add Channel'));

      // Check if addChannel was called with correct name
      await waitFor(() => {
        expect(mockAddChannel).toHaveBeenCalledWith('#test');
      });

      // Check if router.push was called with correct channel ID
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/channels/123');
      });
    });

    it('should show error on duplicate channel name', async () => {
      mockAddChannel.mockRejectedValueOnce(new Error('A channel with this name already exists'));

      render(<ChannelList channels={[]} isLoading={false} />);

      // Open dialog
      fireEvent.click(screen.getByText('+ ADD CHANNEL'));

      // Type channel name
      const input = screen.getByPlaceholderText('Enter channel name...');
      fireEvent.change(input, { target: { value: 'test' } });

      // Click Add Channel button
      fireEvent.click(screen.getByText('Add Channel'));

      // Check error message
      await waitFor(() => {
        expect(screen.getByText('Failed to create channel. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Channel limit enforcement', () => {
    it('should hide add channel button when limit reached', () => {
      // Create array of 10 channels
      const channels = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        name: `#channel${i}`,
        description: null,
        created_by_id: 'test-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<ChannelList channels={channels} isLoading={false} />);

      // Check that add channel button is not present
      expect(screen.queryByText('+ ADD CHANNEL')).not.toBeInTheDocument();
    });

    it('should show add channel button when under limit', () => {
      // Create array of 9 channels
      const channels = Array.from({ length: 9 }, (_, i) => ({
        id: `${i}`,
        name: `#channel${i}`,
        description: null,
        created_by_id: 'test-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<ChannelList channels={channels} isLoading={false} />);

      // Check that add channel button is present
      expect(screen.getByText('+ ADD CHANNEL')).toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should disable inputs and show spinner during channel creation', async () => {
      // Make addChannel take some time to resolve
      mockAddChannel.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<ChannelList channels={[]} isLoading={false} />);

      // Open dialog
      fireEvent.click(screen.getByText('+ ADD CHANNEL'));

      // Type channel name
      const input = screen.getByPlaceholderText('Enter channel name...');
      fireEvent.change(input, { target: { value: 'test' } });

      // Click Add Channel button
      fireEvent.click(screen.getByText('Add Channel'));

      // Check loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(input).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });
}); 