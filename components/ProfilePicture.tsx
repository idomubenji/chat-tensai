import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';

interface ProfilePictureProps {
  avatarUrl: string | null;
  size?: 'default' | 'large' | number;
  className?: string;
  borderColor?: 'black' | 'white';
  borderWidth?: 'thin' | 'thick';
}

const sizeClasses = {
  default: 'w-12 h-12',
  large: 'w-full h-full',
};

const borderClasses = {
  black: 'border-black',
  white: 'border-gray-100',
};

const borderWidthClasses = {
  thin: 'border-2',
  thick: 'border-4',
};

export function ProfilePicture({ 
  avatarUrl, 
  size = 'default', 
  className = '',
  borderColor = 'white',
  borderWidth = 'thick'
}: ProfilePictureProps) {
  const { url: resolvedAvatarUrl, isLoading } = useAvatarUrl(avatarUrl);

  const sizeValue = typeof size === 'number' ? size : undefined;
  const sizeClass = typeof size === 'string' ? sizeClasses[size] : `w-[${size}px] h-[${size}px]`;

  if (isLoading) {
    return (
      <div className={cn('relative', sizeClass, className)}>
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn('relative', sizeClass, className)}>
      <div className={cn(
        'absolute inset-0 rounded-full z-10 border',
        borderClasses[borderColor],
        borderWidthClasses[borderWidth]
      )} />
      <div className="relative w-full h-full">
        <Image
          src={resolvedAvatarUrl || '/default-avatar.jpeg'}
          alt="Profile picture"
          fill
          sizes={typeof size === 'string' ? (size === 'large' ? '192px' : '48px') : `${size}px`}
          className="rounded-full object-cover"
          unoptimized={true}
        />
      </div>
    </div>
  );
}

