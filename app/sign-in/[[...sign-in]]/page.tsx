'use client';

import { SignInForm } from '@/components/SignInForm';
import Link from 'next/link';
import Image from 'next/image';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center space-y-6">
          <Image
            src="/chat-tensai-icon.png"
            alt="Chat Tensai Logo"
            width={300}
            height={300}
            priority
          />
          <Image
            src="/chat-tensai-title.png"
            alt="Chat Tensai"
            width={600}
            height={150}
            priority
          />
        </div>
        <div className="rounded-lg shadow-md p-6 bg-white">
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
    </div>
  );
}
