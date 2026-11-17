import Image from "next/image";
import Link from "next/link";

import NavLinks from "./NavLinks";
import AuthButton from "./AuthButton";

export default function LeftSidebar() {
  return (
    <aside className="left_sidebar">
      <div className="flex flex-col gap-8">
        <Link href="/" className="flex items-center gap-2 max-lg:justify-center max-lg:px-4" aria-label="Groei home">
          <Image src="/icons/Logo.jpeg" alt="" width={28} height={28} className="rounded-md" />
          <span className="text-24 font-extrabold text-white-1 max-lg:hidden">Groei</span>
        </Link>
        <NavLinks compact />
      </div>
      <AuthButton compact className="w-full pb-10 max-lg:px-4 lg:pr-8" />
    </aside>
  );
}
