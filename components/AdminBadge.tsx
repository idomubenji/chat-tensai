import { cn } from '@/lib/utils';

export function AdminBadge({ className }: { className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      'bg-gradient-to-r from-amber-300 to-yellow-400',
      'text-amber-900 border border-amber-500/20',
      'shadow-sm shadow-amber-200/50',
      className
    )}>
      KING TENSAI
    </span>
  );
} 