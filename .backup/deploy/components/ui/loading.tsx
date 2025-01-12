'use client';

import { cn } from "@/lib/utils";

export function LoadingBall({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center h-full w-full", className)}>
      <div className="relative w-16 h-16">
        {/* Outer glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-yellow-300/20 to-purple-600/20 rounded-full blur-xl animate-pulse" />
        
        {/* Main ball layers */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300 to-purple-600 animate-[pulse_2s_ease-in-out_infinite]" />
        <div className="absolute inset-[2px] rounded-full bg-gradient-to-r from-yellow-200 to-purple-500 animate-[pulse_2s_ease-in-out_infinite_200ms]" />
        <div className="absolute inset-[4px] rounded-full bg-gradient-to-r from-yellow-100 to-purple-400 animate-[pulse_2s_ease-in-out_infinite_400ms]" />
        
        {/* Inner core */}
        <div className="absolute inset-[6px] rounded-full bg-white/90 animate-[pulse_2s_ease-in-out_infinite_600ms]">
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/50 to-purple-400/50 rounded-full blur-sm" />
        </div>
      </div>
    </div>
  );
} 