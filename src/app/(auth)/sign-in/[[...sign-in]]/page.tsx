import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import AuthHeading from "@/components/auth/AuthHeading";
import { authFormAppearance } from "@/components/auth/authAppearance";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <AuthHeading title="Welcome back 👋" subtitle="Sign in to keep creating and listening." />
      <SignIn appearance={authFormAppearance} signUpUrl="/sign-up" fallbackRedirectUrl="/" />
    </>
  );
}
