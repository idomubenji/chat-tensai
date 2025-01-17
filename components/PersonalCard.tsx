import { ProfilePicture } from './ProfilePicture';
import { UserName } from './UserName';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import useSWR, { mutate } from 'swr';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Skeleton } from './ui/skeleton';

interface PersonalCardProps {
  className?: string;
}

// Key for the user data SWR cache
export const USER_DATA_KEY = '/api/users/me';

// Fetch function that uses Supabase client directly
const fetcher = async () => {
  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) throw error;
  console.log('Fetched user data:', data);
  return data;
};

export function PersonalCard({ className }: PersonalCardProps) {
  const { user } = useSupabaseAuth();
  const { data: userData, error, isLoading } = useSWR(USER_DATA_KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 30000,
    dedupingInterval: 2000,
    revalidateOnMount: true,
    refreshWhenHidden: true,
    refreshWhenOffline: true,
  });

  console.log('PersonalCard render:', {
    hasUser: !!user,
    userId: user?.id,
    userData,
    error,
    isLoading,
    fetchUrl: USER_DATA_KEY
  });

  if (!user) return null;

  // Show loading state when data is not yet available
  if (isLoading || !userData) {
    return (
      <div className="bg-[#0A1A3B] rounded-2xl p-6 flex items-center gap-6 min-h-[192px]">
        <Skeleton className="h-[154px] w-[154px] rounded-full" />
        <div className="flex flex-col gap-3 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const hasStatus = userData?.status_message || userData?.status_emoji;
  console.log('Status data:', {
    userData,
    hasStatus
  });

  return (
    <div className="bg-[#0A1A3B] rounded-2xl p-6 flex items-center gap-6 min-h-[192px]">
      <div className="relative h-[154px] w-[154px] flex-shrink-0">
        <ProfilePicture 
          size={154}
          avatarUrl={userData?.avatar_url} 
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
          name={userData?.name || user.email || 'Anonymous'} 
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