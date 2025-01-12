'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  const handleAction = () => {
    if (error.message?.toLowerCase().includes('unauthorized') || 
        error.message?.toLowerCase().includes('unauthenticated')) {
      router.push('/sign-in');
    } else {
      reset();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <div className="text-red-600 mb-4">
        Error: {error.message || 'Unknown error'}
      </div>
      <button
        onClick={handleAction}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {error.message?.toLowerCase().includes('unauthorized') ? 'Sign In' : 'Try again'}
      </button>
    </div>
  );
} 