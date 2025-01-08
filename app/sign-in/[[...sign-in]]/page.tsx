import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-lg shadow-md p-6 bg-white",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton: "w-full",
            formButtonPrimary: "bg-[#6F8FAF] hover:bg-[#5A7593]",
            footerAction: "hidden"
          }
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        redirectUrl="/"
      />
    </div>
  );
}
