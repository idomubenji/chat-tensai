import Image from 'next/image';
import { useEffect, useState } from 'react';

export function ProfilePicture() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          const customAvatar = data.avatar_url && !data.avatar_url.includes('img.clerk.com') 
            ? data.avatar_url 
            : '/default-avatar.jpeg';
          setAvatarUrl(customAvatar);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="relative w-10 h-10">
      <Image
        src={avatarUrl || "/default-avatar.jpeg"}
        alt="Profile"
        fill
        sizes="40px"
        className="rounded-full object-cover border-2 border-black"
        priority
        unoptimized={!avatarUrl}
      />
    </div>
  );
}

