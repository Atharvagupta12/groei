import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import AuthHeading from "@/components/auth/AuthHeading";
import { authFormAppearance } from "@/components/auth/authAppearance";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <>
      <AuthHeading
        title="Create your account"
        subtitle="Start making AI podcasts for free. It takes 30 seconds."
      />
      <SignUp appearance={authFormAppearance} signInUrl="/sign-in" fallbackRedirectUrl="/create-podcast" />
    </>
  );
}
