'use client';

import { SignInForm } from '@/components/SignInForm';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
      <div className="w-full max-w-md rounded-lg shadow-md p-6 bg-white">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-[#6F8FAF] hover:text-[#5A7593]">
              Sign up
            </Link>
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
