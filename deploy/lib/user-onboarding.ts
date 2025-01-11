'use client';

export async function handleUserOnboarding(userId: string, email: string, username?: string) {
  try {
    const response = await fetch('/api/users/onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
        username,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to onboard user');
    }

    return { success: true };
  } catch (error) {
    console.error('Error in handleUserOnboarding:', error);
    return { success: false, error };
  }
} 