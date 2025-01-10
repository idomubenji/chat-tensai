import { ProfilePicture } from './ProfilePicture';
import { UserName } from './UserName';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import useSWR from 'swr';

interface PersonalCardProps {
  className?: string;
}

// Fetch function that SWR will use
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch user data');
  return res.json();
};

export function PersonalCard({ className }: PersonalCardProps) {
  const { user } = useSupabaseAuth();
  const { data: userData, error } = useSWR('/api/users/me', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 30000, // Refresh every 30 seconds
    dedupingInterval: 5000, // Only make one request per 5 seconds
  });

  if (!user) return null;

  return (
    <div className="bg-[#0A1A3B] rounded-2xl p-8 flex items-center gap-8 min-h-[240px]">
      <div className="h-[192px] w-[192px] flex-shrink-0">
        <ProfilePicture 
          size="large" 
          avatarUrl={userData?.avatar_url} 
          isLoading={!userData && !error}
        />
      </div>
      <div className="flex flex-col gap-4">
        <UserName 
          name={user.user_metadata?.username || user.email || 'Anonymous'} 
          userId={user.id} 
          role={user.user_metadata?.role}
          className="text-3xl font-bold text-gray-100"
        />
        {userData?.bio && (
          <p className="text-gray-300 text-lg">{userData.bio}</p>
        )}
        {(user.user_metadata?.status_message || user.user_metadata?.status_emoji) && (
          <div className="flex items-center gap-2 text-gray-300 text-lg">
            {user.user_metadata?.status_emoji && (
              <span className="text-2xl">{user.user_metadata.status_emoji}</span>
            )}
            {user.user_metadata?.status_message && (
              <span>{user.user_metadata.status_message}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 