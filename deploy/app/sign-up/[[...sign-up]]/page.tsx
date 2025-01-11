'use client';

import { SignUpForm } from '@/components/SignUpForm';
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3] py-12 px-4 sm:px-6 lg:px-8">
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
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join our community and start chatting
            </p>
          </div>
          <div className="mt-8">
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
