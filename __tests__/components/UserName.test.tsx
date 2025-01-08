import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserName } from '@/components/UserName';
import '@testing-library/jest-dom';

describe('UserName', () => {
  it('renders user name correctly', () => {
    render(
      <UserName
        name="John Doe"
        userId="user1"
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows admin badge for admin users', () => {
    render(
      <UserName
        name="Admin User"
        userId="admin1"
        role="ADMIN"
      />
    );

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('KING TENSAI')).toBeInTheDocument();
  });

  it('does not show admin badge for non-admin users', () => {
    render(
      <UserName
        name="Regular User"
        userId="user1"
        role="USER"
      />
    );

    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.queryByText('KING TENSAI')).not.toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    render(
      <UserName
        name="Test User"
        userId="user1"
        className="custom-class"
      />
    );

    const container = screen.getByText('Test User').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('renders without role prop', () => {
    render(
      <UserName
        name="No Role User"
        userId="user1"
      />
    );

    expect(screen.getByText('No Role User')).toBeInTheDocument();
    expect(screen.queryByText('KING TENSAI')).not.toBeInTheDocument();
  });
}); 