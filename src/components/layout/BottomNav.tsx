"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Compass, Home, Plus, User } from "lucide-react";

import { isActiveRoute } from "@/constants";
import { cn } from "@/lib/utils";

/** App-style tab bar for phones. Hidden from md and up, where the sidebar takes over. */
export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const profileHref = user ? `/profile/${user.id}` : "/sign-in";
  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/create-podcast", label: "Create", icon: Plus, primary: true },
    { href: profileHref, label: user ? "Profile" : "Sign in", icon: User },
  ];

  return (
    <nav
      aria-label="Main"
      className="glassmorphism-black fixed inset-x-0 bottom-0 z-40 h-[var(--nav-h)] border-t border-white/5 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid h-16 grid-cols-4">
        {tabs.map(({ href, label, icon: Icon, primary }) => {
          const active = isActiveRoute(pathname, href);
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                  active ? "text-white-1" : "text-white-3 hover:text-white-2"
                )}
              >
                {primary ? (
                  <span
                    className={cn(
                      "flex-center size-9 rounded-xl bg-violet-600 text-white-1 shadow-lg shadow-violet-900/40 transition-transform",
                      active && "scale-105 bg-violet-500"
                    )}
                  >
                    <Icon className="size-5" strokeWidth={2.5} />
                  </span>
                ) : (
                  <Icon className={cn("size-[22px]", active && "text-violet-400")} strokeWidth={active ? 2.5 : 2} />
                )}
                {!primary && label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
