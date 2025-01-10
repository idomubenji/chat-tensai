import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProfilePictureProps {
  size?: 'default' | 'large';
  className?: string;
  avatarUrl?: string | null;
  isLoading?: boolean;
}

const sizeClasses = {
  default: 'w-12 h-12',
  large: 'w-full h-full',
};

export function ProfilePicture({ 
  size = 'default', 
  className,
  avatarUrl,
  isLoading = false,
}: ProfilePictureProps) {
  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute inset-0 rounded-full border-4 border-gray-100 z-10" />
      {isLoading ? (
        <div className="absolute inset-0 rounded-full bg-gray-700 animate-pulse" />
      ) : (
        <Image
          src={avatarUrl || "/default-avatar.jpeg"}
          alt="Profile"
          fill
          sizes={size === 'large' ? '192px' : '48px'}
          className="rounded-full object-cover hover:opacity-80 transition-opacity"
          priority
          unoptimized={!avatarUrl}
        />
      )}
    </div>
  );
}

