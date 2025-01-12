import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
  const [finalAvatarUrl, setFinalAvatarUrl] = useState<string>('/default-avatar.png');

  useEffect(() => {
    async function getSignedUrl() {
      if (!avatarUrl) {
        setFinalAvatarUrl('/default-avatar.jpeg');
        return;
      }

      if (!avatarUrl.startsWith('avatars/')) {
        setFinalAvatarUrl(avatarUrl);
        return;
      }

      try {
        const response = await fetch(`/api/s3-url?key=${encodeURIComponent(avatarUrl)}`);
        if (!response.ok) throw new Error('Failed to get signed URL');
        const data = await response.json();
        setFinalAvatarUrl(data.url);
      } catch (error) {
        console.error('Error getting signed URL:', error);
        setFinalAvatarUrl('/default-avatar.jpeg');
      }
    }

    getSignedUrl();
  }, [avatarUrl]);

  const sizeValue = typeof size === 'number' ? size : undefined;
  const sizeClass = typeof size === 'string' ? sizeClasses[size] : `w-[${size}px] h-[${size}px]`;

  return (
    <div className={cn("relative", sizeClass, className)}>
      <div className={cn(
        "absolute inset-0 rounded-full z-10 border",
        borderClasses[borderColor],
        borderWidthClasses[borderWidth]
      )} />
      <div className="relative w-full h-full">
        <Image
          src={finalAvatarUrl}
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

