'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { LoadingBall } from '@/components/ui/loading';
import { Sidebar } from '@/components/Sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { EmojiPicker } from '@/components/EmojiPicker';
import { PersonalCard } from '@/components/PersonalCard';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { mutate } from 'swr';
import { USER_DATA_KEY } from '@/components/PersonalCard';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';

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

interface UserSettings {
  bio: string;
  status_message: string;
  status_emoji: string;
  avatar_url: string | null;
  username?: string;
}

export default function SettingsPage() {
  const { user, isLoaded } = useSupabaseAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use SWR to fetch user data only when session is loaded
  const { data: userData, mutate, isLoading } = useSWR(
    isLoaded && user ? USER_DATA_KEY : null,
    fetcher
  );

  const [settings, setSettings] = useState<UserSettings>({
    bio: '',
    status_message: '',
    status_emoji: '',
    avatar_url: null,
    username: '',
  });

  console.log('Settings page render:', {
    isLoaded,
    hasUser: !!user,
    userId: user?.id,
    userData,
    isLoading,
    settings,
    fetchUrl: isLoaded && user ? USER_DATA_KEY : null
  });

  // Update settings when userData changes
  useEffect(() => {
    if (userData) {
      console.log('Settings userData update:', userData);
      setSettings({
        bio: userData.bio || '',
        status_message: userData.status_message || '',
        status_emoji: userData.status_emoji || '',
        avatar_url: userData.avatar_url,
        username: userData.name || user?.user_metadata?.username || '',
      });
    }
  }, [userData, user]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClientComponentClient();
      
      // Optimistically update the UI
      await mutate(
        { ...userData, ...settings, name: settings.username },
        false // Don't revalidate immediately
      );
      
      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          bio: settings.bio,
          status_message: settings.status_message,
          status_emoji: settings.status_emoji,
          name: settings.username,
          avatar_url: settings.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      
      // Update user metadata in Supabase auth
      await supabase.auth.updateUser({
        data: { username: settings.username }
      });
      
      // Revalidate the data
      await mutate();
      
      toast({
        title: 'Settings saved!',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      // If there was an error, revalidate to get the correct data
      await mutate();
      console.error('Error saving settings:', error);
      toast({
        title: 'Error saving settings',
        description: 'There was a problem updating your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const supabase = createClientComponentClient();
      
      // Delete user's data
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user?.id);

      if (error) throw error;
      
      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isLoaded) {
    return <LoadingBall />;
  }

  if (!user) {
    return null;
  }

  // Show loading state when data is not yet available
  if (isLoading || !userData) {
    return (
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 p-6 bg-[#F5E6D3] overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            
            <PersonalCard />

            <div className="space-y-6 bg-white p-6 rounded-lg shadow">
              <div className="flex justify-center">
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Skeleton className="h-[100px] w-full" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6 bg-[#F5E6D3] overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          <PersonalCard />

          <div className="space-y-6 bg-white p-6 rounded-lg shadow">
            <AvatarUpload
              currentAvatarUrl={settings.avatar_url}
              onUpload={(url) => setSettings({ ...settings, avatar_url: url })}
            />

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={settings.username}
                onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                placeholder="Your username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={settings.bio}
                onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <div className="flex gap-2">
                <Input
                  id="status"
                  value={settings.status_message}
                  onChange={(e) => setSettings({ ...settings, status_message: e.target.value })}
                  placeholder="What's happening?"
                  maxLength={25}
                />
                <EmojiPicker
                  value={settings.status_emoji}
                  onChange={(emoji) => setSettings({ ...settings, status_emoji: emoji })}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#6F8FAF] hover:bg-[#5A7593]"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

