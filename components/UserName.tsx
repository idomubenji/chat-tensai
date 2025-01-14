import { cn } from '@/lib/utils';
import { AdminBadge } from './AdminBadge';

interface UserNameProps {
  name: string;
  userId: string;
  role?: string;
  className?: string;
}

export function UserName({ name, userId, role, className }: UserNameProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('font-semibold', className)}>{name}</span>
      {role === 'ADMIN' && <AdminBadge />}
    </div>
  );
} 