import { ProfilePicture } from './ProfilePicture';
import { UserName } from './UserName';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import useSWR, { mutate } from 'swr';

interface PersonalCardProps {
  className?: string;
}

// Fetch function that SWR will use
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch user data');
  const data = await res.json();
  console.log('Fetched user data:', data);
  return data;
};

// Key for the user data SWR cache
export const USER_DATA_KEY = '/api/users/me';

export function PersonalCard({ className }: PersonalCardProps) {
  const { user } = useSupabaseAuth();
  const { data: userData, error } = useSWR(USER_DATA_KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 30000,
    dedupingInterval: 2000,
    revalidateOnMount: true,
    refreshWhenHidden: true,
    refreshWhenOffline: true,
  });

  if (!user) return null;

  const hasStatus = userData?.status_message || userData?.status_emoji;
  console.log('Status data:', {
    userData,
    hasStatus
  });

  return (
    <div className="bg-[#0A1A3B] rounded-2xl p-6 flex items-center gap-6 min-h-[192px]">
      <div className="relative h-[154px] w-[154px] flex-shrink-0">
        <ProfilePicture 
          size="large" 
          avatarUrl={userData?.avatar_url} 
          isLoading={!userData && !error}
          borderColor="white"
          borderWidth="thick"
        />
        {hasStatus && (
          <div className="absolute left-0 top-0 bg-gray-100/80 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-gray-800 text-sm border border-gray-200 shadow-lg z-10">
            {userData?.status_emoji && (
              <span className="text-base">{userData.status_emoji}</span>
            )}
            {userData?.status_message && (
              <span className="max-w-[108px] truncate">{userData.status_message}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <UserName 
          name={user.user_metadata?.username || user.email || 'Anonymous'} 
          userId={user.id} 
          role={user.user_metadata?.role}
          className="text-2xl font-bold text-gray-100"
        />
        {userData?.bio && (
          <p className="text-gray-300 text-base">{userData.bio}</p>
        )}
      </div>
    </div>
  );
} 