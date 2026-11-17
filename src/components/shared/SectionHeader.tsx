import Link from "next/link";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  href?: string;
  linkText?: string;
  className?: string;
}

export default function SectionHeader({ title, href, linkText = "See all", className }: SectionHeaderProps) {
  return (
    <header className={cn("flex items-center justify-between", className)}>
      <h2 className="text-18 font-bold text-white-1">{title}</h2>
      {href && (
        <Link href={href} className="text-14 font-semibold text-violet-400 hover:text-violet-300">
          {linkText}
        </Link>
      )}
    </header>
  );
}
