import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AvatarUpload } from '@/components/AvatarUpload';

// Mock fetch
global.fetch = jest.fn();

describe('AvatarUpload', () => {
  const mockOnUpload = jest.fn();
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders with current avatar', () => {
    render(
      <AvatarUpload
        currentAvatarUrl="https://example.com/avatar.jpg"
        onUpload={mockOnUpload}
      />
    );

    expect(screen.getByAltText('Current avatar')).toBeInTheDocument();
  });

  it('renders without current avatar', () => {
    render(<AvatarUpload onUpload={mockOnUpload} />);

    expect(screen.queryByAltText('Current avatar')).not.toBeInTheDocument();
    expect(screen.getByText(/Drag and drop an image here/)).toBeInTheDocument();
  });

  it('handles file upload successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://example.com/new-avatar.jpg' }),
    });

    render(<AvatarUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText('Avatar');
    Object.defineProperty(input, 'files', {
      value: [mockFile],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith('https://example.com/new-avatar.jpg');
    });
  });

  it('handles file upload failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<AvatarUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText('Avatar');
    Object.defineProperty(input, 'files', {
      value: [mockFile],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('Failed to upload avatar')).toBeInTheDocument();
    });
  });

  it('validates file size', async () => {
    const largeFile = new File(['test'.repeat(1000000)], 'large.jpg', { type: 'image/jpeg' });

    render(<AvatarUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText('Avatar');
    Object.defineProperty(input, 'files', {
      value: [largeFile],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
    });
  });

  it('validates file type', async () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    render(<AvatarUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText('Avatar');
    Object.defineProperty(input, 'files', {
      value: [invalidFile],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('File must be an image')).toBeInTheDocument();
    });
  });

  it('shows loading state during upload', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<AvatarUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText('Avatar');
    Object.defineProperty(input, 'files', {
      value: [mockFile],
    });

    fireEvent.change(input);

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });
}); 