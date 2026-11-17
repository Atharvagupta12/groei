"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AuthButton({ compact, className }: { compact?: boolean; className?: string }) {
  const { signOut } = useClerk();
  const label = cn(compact && "max-lg:sr-only");

  return (
    <div className={className}>
      <SignedOut>
        <Button asChild className="w-full gap-2 bg-violet-600 text-16 font-extrabold hover:bg-violet-500">
          <Link href="/sign-in">
            <LogIn className="size-5 shrink-0" />
            <span className={label}>Sign in</span>
          </Link>
        </Button>
      </SignedOut>
      <SignedIn>
        <Button
          variant="outline"
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full gap-2 border-black-5 bg-transparent text-16 font-bold text-white-1 hover:bg-black-2 hover:text-white-1"
        >
          <LogOut className="size-5 shrink-0" />
          <span className={label}>Log out</span>
        </Button>
      </SignedIn>
    </div>
  );
}
