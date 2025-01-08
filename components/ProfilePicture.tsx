import Image from 'next/image';
import useSWR from 'swr';

// Fetch function that SWR will use
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch user data');
  const data = await res.json();
  // Only use Clerk's avatar if we don't have a custom one and it's not the default Clerk avatar
  return data.avatar_url && !data.avatar_url.includes('img.clerk.com')
    ? data.avatar_url
    : '/default-avatar.jpeg';
};

export function ProfilePicture() {
  // SWR will automatically cache the result and revalidate periodically
  const { data: avatarUrl, error } = useSWR('/api/users/me', fetcher, {
    revalidateOnFocus: false, // Don't revalidate when window focuses
    revalidateOnReconnect: false, // Don't revalidate on reconnection
    dedupingInterval: 60000, // Only make one request per minute
  });

  if (error) console.error('Error loading avatar:', error);

  return (
    <div className="relative w-12 h-12">
      <Image
        src={avatarUrl || "/default-avatar.jpeg"}
        alt="Profile"
        fill
        sizes="48px"
        className="rounded-full object-cover border-2 border-black hover:opacity-80 transition-opacity"
        priority
        unoptimized={!avatarUrl}
      />
    </div>
  );
}

