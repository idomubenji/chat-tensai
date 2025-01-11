'use client';

import { cn } from "@/lib/utils";

interface LoadingBallProps {
  className?: string;
}

/**
 * A loading indicator component that displays an animated glowing ball
 * Used to show loading states throughout the application
 */
export function LoadingBall({ className }: LoadingBallProps) {
  return (
    <div className={cn("flex items-center justify-center h-full bg-[#F5E6D3]", className)}>
      <div 
        data-testid="loading-ball"
        className={cn(
          "w-12 h-12 rounded-full",
          "bg-gradient-to-r from-yellow-300 to-purple-500",
          "shadow-[0_0_20px_rgba(252,211,77,0.7)]",
          "animate-glow"
        )} 
      />
    </div>
  );
} 