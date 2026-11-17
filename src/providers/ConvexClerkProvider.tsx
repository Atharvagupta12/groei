"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react";
import { ReactNode, useEffect, useRef } from "react";

import { api } from "@convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to create .env.local.");
}
const convex = new ConvexReactClient(convexUrl);

/** Makes sure the signed-in user has a Convex profile, even if the Clerk webhook hasn't arrived. */
function UserSync() {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const synced = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      synced.current = false;
      return;
    }
    if (synced.current) return;
    synced.current = true;
    storeUser().catch((error) => {
      synced.current = false;
      console.error("Failed to sync user", error);
    });
  }, [isAuthenticated, storeUser]);

  return null;
}

export default function ConvexClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#7c3aed",
          colorBackground: "#15171C",
          colorText: "#FFFFFF",
          colorTextSecondary: "rgba(255, 255, 255, 0.64)",
          colorInputBackground: "#1B1D23",
          colorInputText: "#FFFFFF",
          colorDanger: "#f87171",
          colorSuccess: "#4ade80",
          borderRadius: "0.625rem",
          fontFamily: "inherit",
        },
        elements: {
          formButtonPrimary:
            "bg-violet-600 hover:bg-violet-500 text-[15px] font-bold normal-case shadow-none",
          socialButtonsBlockButton: "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]",
          formFieldInput: "border-white/10 focus:border-violet-500",
          footerActionLink: "text-violet-400 hover:text-violet-300 font-semibold",
          userButtonPopoverCard: "border border-white/10",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <UserSync />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
