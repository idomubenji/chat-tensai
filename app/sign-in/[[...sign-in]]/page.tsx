import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account or{' '}
            <a href="/sign-up" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new one
            </a>
          </p>
        </div>
        <div className="mt-8">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "rounded-lg shadow-md p-6 bg-white",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "w-full",
                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                footerAction: "hidden"
              }
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            redirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
}
