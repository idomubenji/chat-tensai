"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LoadingBall } from "@/components/ui/loading";
import { Sidebar } from "@/components/Sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { EmojiPicker } from "@/components/EmojiPicker";
import Image from "next/image";

interface UserSettings {
  bio: string;
  status_message: string;
  status_emoji: string;
  avatar_url: string | null;
}

export default function SettingsPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    bio: "",
    status_message: "",
    status_emoji: "",
    avatar_url: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    } else if (userId) {
      // Fetch user settings
      fetchUserSettings();
    }
  }, [isLoaded, userId, router]);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          bio: data.bio || "",
          status_message: data.status_message || "",
          status_emoji: data.status_emoji || "",
          avatar_url: data.avatar_url || null
        });
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Avatar upload failed:', errorText);
        throw new Error(errorText);
      }

      const data = await response.json();
      setSettings(prev => ({ ...prev, avatar_url: data.avatar_url }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      // Show error to user (you might want to add a toast or error message UI)
      alert(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaveStatus('saving');
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setSaveStatus('success');
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/sign-in');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const response = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove avatar');
      }

      const data = await response.json();
      setSettings(prev => ({ ...prev, avatar_url: data.avatar_url }));
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('Failed to remove profile picture');
    }
  };

  // Show loading state while checking auth
  if (!isLoaded) {
    return <LoadingBall />;
  }

  // Return null while redirecting to sign-in
  if (!userId) {
    return null;
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6 bg-[#F5E6D3]">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold">User Settings</h1>

          {/* Profile Picture Section */}
          <div className="space-y-4 bg-white/90 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold">Profile Picture</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <Image
                  src={settings.avatar_url || "/default-avatar.jpeg"}
                  alt="Profile"
                  fill
                  sizes="96px"
                  className="rounded-full object-cover border-2 border-gray-200"
                  priority
                  unoptimized={!settings.avatar_url}
                />
              </div>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                  className="bg-white"
                />
                <p className="text-sm text-gray-500">
                  {isUploading ? 'Uploading...' : 'Upload a new profile picture'}
                </p>
                {settings.avatar_url && settings.avatar_url !== '/default-avatar.jpeg' && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveAvatar}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove Profile Picture
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-4 bg-white/90 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold">Bio</h2>
            <Textarea
              value={settings.bio}
              onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              className="min-h-[100px] bg-white"
            />
          </div>

          {/* Status Section */}
          <div className="space-y-4 bg-white/90 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold">Status</h2>
            <div className="flex items-center gap-2">
              <div className="w-10">
                <EmojiPicker
                  value={settings.status_emoji}
                  onChange={(emoji) => setSettings(prev => ({ ...prev, status_emoji: emoji }))}
                />
              </div>
              <Input
                value={settings.status_message}
                onChange={(e) => setSettings(prev => ({ ...prev, status_message: e.target.value.slice(0, 25) }))}
                placeholder="What's your status?"
                maxLength={25}
                className="bg-white"
              />
            </div>
            <p className="text-sm text-gray-500">
              {25 - settings.status_message.length} characters remaining
            </p>
          </div>

          {/* Save Button */}
          <div className="space-y-2">
            <Button 
              onClick={handleSaveSettings} 
              className="w-full"
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
            </Button>
            {saveStatus === 'success' && (
              <p className="text-sm text-green-600 text-center">Settings saved successfully!</p>
            )}
            {saveStatus === 'error' && (
              <p className="text-sm text-red-600 text-center">Failed to save settings. Please try again.</p>
            )}
          </div>

          {/* Delete Account Section */}
          <div className="pt-8">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  ⚠️ Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all of your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

