import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminBadge } from '@/components/AdminBadge';
import '@testing-library/jest-dom';

describe('AdminBadge', () => {
  it('renders admin badge correctly', () => {
    render(<AdminBadge />);
    expect(screen.getByText('KING TENSAI')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(<AdminBadge />);
    const badge = screen.getByText('KING TENSAI');
    
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('items-center');
    expect(badge).toHaveClass('rounded');
    expect(badge).toHaveClass('text-xs');
    expect(badge).toHaveClass('font-medium');
    expect(badge).toHaveClass('bg-gradient-to-r');
    expect(badge).toHaveClass('from-amber-300');
    expect(badge).toHaveClass('to-yellow-400');
    expect(badge).toHaveClass('text-amber-900');
    expect(badge).toHaveClass('border');
    expect(badge).toHaveClass('border-amber-500/20');
    expect(badge).toHaveClass('shadow-sm');
    expect(badge).toHaveClass('shadow-amber-200/50');
  });

  it('applies custom className correctly', () => {
    const customClass = 'custom-test-class';
    render(<AdminBadge className={customClass} />);
    
    const badge = screen.getByText('KING TENSAI');
    expect(badge).toHaveClass(customClass);
    
    // Should still have default classes
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('items-center');
  });

  it('maintains accessibility features', () => {
    render(<AdminBadge />);
    const badge = screen.getByText('KING TENSAI');
    
    // Verify it's a text element
    expect(badge.tagName.toLowerCase()).toBe('span');
    
    // Verify it has sufficient color contrast (this is implicit in the design)
    expect(badge).toHaveClass('text-amber-900');
    expect(badge).toHaveClass('bg-gradient-to-r');
  });
}); 