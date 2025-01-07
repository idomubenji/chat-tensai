import { cn } from "@/lib/utils";

export function LoadingBall() {
  return (
    <div className="flex items-center justify-center h-full bg-[#F5E6D3]">
      <div className={cn(
        "w-12 h-12 rounded-full",
        "bg-gradient-to-r from-yellow-300 to-purple-500",
        "shadow-[0_0_20px_rgba(252,211,77,0.7)]",
        "animate-glow animate-fade-in"
      )} />
    </div>
  );
} 