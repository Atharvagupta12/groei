import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

/** Compact header for phones: logo plus account access. Navigation lives in the bottom tab bar. */
export default function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 -mx-4 flex h-14 items-center justify-between bg-black-3/85 px-4 backdrop-blur-lg sm:-mx-10 sm:px-10 md:hidden">
      <Link href="/" className="flex items-center gap-2" aria-label="Groei home">
        <Image src="/icons/Logo.jpeg" width={28} height={28} alt="" className="rounded-md" />
        <span className="text-18 font-extrabold text-white-1">Groei</span>
      </Link>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <Button asChild size="sm" className="h-8 rounded-full bg-violet-600 px-4 font-bold hover:bg-violet-500">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </SignedOut>
    </header>
  );
}
