import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingBall } from '@/components/LoadingBall';
import '@testing-library/jest-dom';

describe('LoadingBall', () => {
  it('renders loading ball container correctly', () => {
    const { container } = render(<LoadingBall />);
    const outerContainer = container.firstChild as HTMLElement;
    
    expect(outerContainer).toHaveClass('flex');
    expect(outerContainer).toHaveClass('items-center');
    expect(outerContainer).toHaveClass('justify-center');
    expect(outerContainer).toHaveClass('h-full');
    expect(outerContainer).toHaveClass('bg-[#F5E6D3]');
  });

  it('renders loading ball with correct styles', () => {
    render(<LoadingBall />);
    const ball = screen.getByTestId('loading-ball');
    
    // Test the classes that should be present in the combined className
    expect(ball).toHaveClass('w-12');
    expect(ball).toHaveClass('h-12');
    expect(ball).toHaveClass('rounded-full');
    expect(ball).toHaveClass('bg-gradient-to-r');
    expect(ball).toHaveClass('from-yellow-300');
    expect(ball).toHaveClass('to-purple-500');
    expect(ball).toHaveClass('shadow-[0_0_20px_rgba(252,211,77,0.7)]');
    expect(ball).toHaveClass('animate-glow');
    expect(ball).toHaveClass('animate-fade-in');
  });
}); 