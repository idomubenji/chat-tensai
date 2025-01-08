import React from 'react';
import { render } from '@testing-library/react';
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
    const { container } = render(<LoadingBall />);
    const ball = container.querySelector('div > div:last-child') as HTMLElement;
    const ballClasses = ball.className.split(' ');
    
    expect(ballClasses).toContain('w-12');
    expect(ballClasses).toContain('h-12');
    expect(ballClasses).toContain('rounded-full');
    expect(ballClasses).toContain('bg-gradient-to-r');
    expect(ballClasses).toContain('from-yellow-300');
    expect(ballClasses).toContain('to-purple-500');
    expect(ballClasses).toContain('shadow-[0_0_20px_rgba(252,211,77,0.7)]');
    expect(ballClasses).toContain('animate-glow');
    expect(ballClasses).toContain('animate-fade-in');
  });
}); 