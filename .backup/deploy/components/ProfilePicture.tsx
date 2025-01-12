import Image from 'next/image';
import { cn } from '@/lib/utils';
import useSWR from 'swr';

interface ProfilePictureProps {
  size?: 'default' | 'large';
  className?: string;
  avatarUrl?: string | null;
  isLoading?: boolean;
  borderColor?: 'black' | 'white';
  borderWidth?: 'thin' | 'thick';
  shouldFetch?: boolean;
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

// Key for the user data SWR cache
export const USER_DATA_KEY = '/api/users/me';

// Fetch function that SWR will use
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch user data');
  const data = await res.json();
  return data;
};

export function ProfilePicture({ 
  size = 'default', 
  className,
  avatarUrl,
  isLoading = false,
  borderColor = 'white',
  borderWidth = 'thick',
  shouldFetch = false,
}: ProfilePictureProps) {
  // Only fetch if shouldFetch is true and no avatarUrl is provided
  const { data: userData, error } = useSWR(
    shouldFetch ? USER_DATA_KEY : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
      dedupingInterval: 2000,
      revalidateOnMount: true,
    }
  );

  const finalAvatarUrl = avatarUrl || userData?.avatar_url || "/default-avatar.jpeg";
  const showLoading = isLoading || (shouldFetch && !userData && !error);

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className={cn(
        "absolute inset-0 rounded-full z-10 border",
        borderClasses[borderColor],
        borderWidthClasses[borderWidth]
      )} />
      {showLoading ? (
        <div className="absolute inset-0 rounded-full bg-gray-700 animate-pulse" />
      ) : (
        <Image
          src={finalAvatarUrl}
          alt="Profile"
          fill
          sizes={size === 'large' ? '192px' : '48px'}
          className="rounded-full object-cover hover:opacity-80 transition-opacity"
          priority
          unoptimized={finalAvatarUrl === "/default-avatar.jpeg"}
        />
      )}
    </div>
  );
}

