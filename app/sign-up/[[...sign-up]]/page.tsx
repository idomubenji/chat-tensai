'use client';

import { SignUpForm } from '@/components/SignUpForm';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our community and start chatting
          </p>
        </div>
        <div className="mt-8">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
