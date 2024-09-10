"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { sidebarLinks } from "../../../constants";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
import { Button } from "./button";

const LeftSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  return (
    <section className="left_sidebar">
      <nav className="flex flex-col gap-6">
        <Link
          href="/"
          className="flex items-center pb-10 max-lg:justify-center cursor-pointer gap-1 "
        >
          <Image src="/icons/Logo.jpeg" alt="logo" width={23} height={23} />
          <h1 className="text-24 font-extrabold text-white max:lg:hidden">
            Groei
          </h1>
        </Link>

        {sidebarLinks.map(({ route, label, imgURL }) => {
          const isActive =
            pathname === route || pathname.startsWith(`${route}/`);

          return (
            <Link
              href={route}
              key={label}
              className={cn(
                "flex gap-3 items-center py-4 max-lg:px-4 justify-center lg:justify-start ",
                {
                  "bg-nav-focus border-r-4 border-violet-600": isActive,
                }
              )}
            >
              <Image src={imgURL} alt={label} width={24} height={24} />
              <p>{label}</p>
            </Link>
          );
        })}
      </nav>
      <SignedOut>
        <div className="flex-center w-full pb-14 max-lg:px-4 lg:pr-8">
          <Button asChild  className="text-16 w-full bg-violet-600 font-extrabold ">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="flex-center w-full pb-14 max-lg:px-4 lg:pr-8">
          <Button  className="text-16 w-full bg-violet-600 font-extrabold " onClick={() => 
            signOut(() => router.push('/'))}>
            Log Out
          </Button>
        </div>
      </SignedIn>
    </section>
  );
};

export default LeftSidebar;
