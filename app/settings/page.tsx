"use client";

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Return null while redirecting to sign-in
  if (!userId) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Profile</h2>
          <p>Edit your profile information here.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p>Manage your notification preferences.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Privacy</h2>
          <p>Control your privacy settings.</p>
        </div>
        <Button asChild>
          <Link href="/">Back to Chat</Link>
        </Button>
      </div>
    </div>
  )
}

