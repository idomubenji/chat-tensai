"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { LoadingBall } from "@/components/ui/loading";
import { Sidebar } from "@/components/Sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { EmojiPicker } from "@/components/EmojiPicker";
import { PersonalCard } from "@/components/PersonalCard";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { mutate } from 'swr';
import { USER_DATA_KEY } from '@/components/PersonalCard';

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
  const [settings, setSettings] = useState<UserSettings>({
    bio: "",
    status_message: "",
    status_emoji: "",
    avatar_url: null,
    username: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    // Fetch user settings
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (!response.ok) throw new Error('Failed to fetch user settings');
        const data = await response.json();
        setSettings({
          bio: data.bio || "",
          status_message: data.status_message || "",
          status_emoji: data.status_emoji || "",
          avatar_url: data.avatar_url,
          username: user?.user_metadata?.username || "",
        });
      } catch (error) {
        console.error('Error fetching user settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings. Please try refreshing the page.",
        });
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [isLoaded, user, router, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: settings.bio,
          status_message: settings.status_message,
          status_emoji: settings.status_emoji,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user settings');
      }

      const updatedData = await response.json();
      
      // Trigger revalidation of the user data
      await mutate(USER_DATA_KEY, updatedData, false);
      
      toast({
        title: 'Settings saved!',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
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
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete account');
      router.push('/sign-in');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete account. Please try again.",
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
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#6F8FAF] hover:bg-[#5A7593]"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

