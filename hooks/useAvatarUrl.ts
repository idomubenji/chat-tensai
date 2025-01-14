import { useState, useEffect } from 'react';

export function useAvatarUrl(avatarKey: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!avatarKey) {
      setUrl(null);
      setIsLoading(false);
      return;
    }

    // If it's already a full URL (for backward compatibility), use it directly
    if (avatarKey.startsWith('http')) {
      setUrl(avatarKey);
      setIsLoading(false);
      return;
    }

    // If it's the default avatar, use it directly
    if (avatarKey === '/default-avatar.jpeg') {
      setUrl(avatarKey);
      setIsLoading(false);
      return;
    }

    async function fetchSignedUrl() {
      try {
        setIsLoading(true);
        const encodedKey = encodeURIComponent(avatarKey as string);
        const response = await fetch(`/api/users/me/avatar/${encodedKey}`);
        if (!response.ok) {
          throw new Error('Failed to get signed URL');
        }
        const data = await response.json();
        setUrl(data.url);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get avatar URL'));
        setUrl(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSignedUrl();
  }, [avatarKey]);

  return { url, isLoading, error };
} 