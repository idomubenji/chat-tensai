import { render, screen } from '@testing-library/react';
import { PersonalCard } from '@/components/PersonalCard';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// Mock the hooks
jest.mock('@/hooks/useSupabaseAuth');

describe('PersonalCard', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      username: 'TestUser',
      role: 'USER',
      status_message: 'Test status',
      status_emoji: '👋',
    },
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock useSupabaseAuth
    (useSupabaseAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });
  });

  it('renders nothing when user is not authenticated', () => {
    (useSupabaseAuth as jest.Mock).mockReturnValue({
      user: null,
    });

    const { container } = render(<PersonalCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders user information correctly', () => {
    render(<PersonalCard />);

    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('Test status')).toBeInTheDocument();
    expect(screen.getByText('👋')).toBeInTheDocument();
  });

  it('falls back to email when username is not available', () => {
    (useSupabaseAuth as jest.Mock).mockReturnValue({
      user: {
        ...mockUser,
        user_metadata: {},
      },
    });

    render(<PersonalCard />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('falls back to Anonymous when neither username nor email is available', () => {
    (useSupabaseAuth as jest.Mock).mockReturnValue({
      user: {
        id: 'test-user-id',
        user_metadata: {},
      },
    });

    render(<PersonalCard />);
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('does not render status section when no status is set', () => {
    (useSupabaseAuth as jest.Mock).mockReturnValue({
      user: {
        ...mockUser,
        user_metadata: {
          username: 'TestUser',
          role: 'USER',
        },
      },
    });

    const { container } = render(<PersonalCard />);
    expect(container.querySelector('.text-gray-300')).not.toBeInTheDocument();
  });

  it('renders admin badge for admin users', () => {
    (useSupabaseAuth as jest.Mock).mockReturnValue({
      user: {
        ...mockUser,
        user_metadata: {
          ...mockUser.user_metadata,
          role: 'ADMIN',
        },
      },
    });

    render(<PersonalCard />);
    expect(screen.getByText('KING TENSAI')).toBeInTheDocument();
  });
}); 