import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import SettingsPage from '@/app/settings/page';
import { useToast } from '@/components/ui/use-toast';

// Mock the hooks
jest.mock('@/hooks/useSupabaseAuth');
jest.mock('next/navigation');
jest.mock('@/components/ui/use-toast');

// Mock fetch
global.fetch = jest.fn();

describe('SettingsPage', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      username: 'TestUser',
      role: 'USER',
    },
  };

  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };

  const mockToast = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock useSupabaseAuth
    (useSupabaseAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Mock useToast
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });

    // Mock fetch for initial settings load
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        bio: 'Test bio',
        status_message: 'Test status',
        status_emoji: '👋',
        avatar_url: 'https://example.com/avatar.jpg',
      }),
    });
  });

  it('redirects to sign-in if user is not authenticated', () => {
    (useSupabaseAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true,
    });

    render(<SettingsPage />);
    expect(mockRouter.push).toHaveBeenCalledWith('/sign-in');
  });

  it('loads and displays user settings', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test status')).toBeInTheDocument();
    });
  });

  it('handles settings update successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          bio: 'Test bio',
          status_message: 'Test status',
          status_emoji: '👋',
          avatar_url: 'https://example.com/avatar.jpg',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
    });

    const bioInput = screen.getByLabelText('Bio');
    fireEvent.change(bioInput, { target: { value: 'Updated bio' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Your settings have been saved successfully.',
        duration: 3000,
      });
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it('handles settings update failure', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          bio: 'Test bio',
          status_message: 'Test status',
          status_emoji: '👋',
          avatar_url: 'https://example.com/avatar.jpg',
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
    });

    const bioInput = screen.getByLabelText('Bio');
    fireEvent.change(bioInput, { target: { value: 'Updated bio' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
      });
    });
  });

  it('handles account deletion with confirmation', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          bio: 'Test bio',
          status_message: 'Test status',
          status_emoji: '👋',
          avatar_url: 'https://example.com/avatar.jpg',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<SettingsPage />);

    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Delete Account', { selector: 'button.bg-red-500' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/sign-in');
    });
  });

  it('handles account deletion failure', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          bio: 'Test bio',
          status_message: 'Test status',
          status_emoji: '👋',
          avatar_url: 'https://example.com/avatar.jpg',
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<SettingsPage />);

    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Delete Account', { selector: 'button.bg-red-500' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
      });
    });
  });
}); 