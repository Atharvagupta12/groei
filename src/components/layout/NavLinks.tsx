"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { isActiveRoute, sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";

/** Main navigation, shared by the desktop sidebar and the mobile sheet. */
export default function NavLinks({
  onNavigate,
  compact,
}: {
  onNavigate?: () => void;
  /** Collapses labels between md and lg breakpoints (desktop sidebar only). */
  compact?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useUser();

  const links = [
    ...sidebarLinks,
    ...(user ? [{ imgURL: "/icons/profile.svg", route: `/profile/${user.id}`, label: "My Profile" }] : []),
  ];

  return (
    <nav className="flex flex-col gap-2" aria-label="Main">
      {links.map(({ route, label, imgURL }) => {
        const active = isActiveRoute(pathname, route);
        return (
          <Link
            key={route}
            href={route}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={label}
            className={cn(
              "flex items-center gap-3 rounded-l-md py-3.5 text-16 font-semibold text-white-2 transition-colors hover:text-white-1",
              compact ? "justify-center px-4 lg:justify-start lg:px-3" : "px-4",
              active && "border-r-4 border-violet-600 bg-nav-focus text-white-1"
            )}
          >
            <Image src={imgURL} alt="" width={24} height={24} />
            <span className={cn(compact && "max-lg:sr-only")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
