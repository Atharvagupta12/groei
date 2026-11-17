import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AuthShowcase from "@/components/auth/AuthShowcase";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="grid min-h-screen bg-black-3 lg:grid-cols-[1.1fr_1fr]">
      <AuthShowcase />

      <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10">
        {/* Soft glow behind the form on mobile, where the brand panel is hidden */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.25),transparent_70%)] lg:hidden" />

        <div className="relative flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md text-14 font-semibold text-white-2 transition-colors hover:text-white-1"
          >
            <ArrowLeft className="size-4" /> Back to Groei
          </Link>
          <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="Groei home">
            <Image src="/icons/Logo.jpeg" alt="" width={28} height={28} className="rounded-md" />
            <span className="text-18 font-extrabold text-white-1">Groei</span>
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        <p className="relative text-center text-12 text-white-3">
          By continuing you agree to use Groei responsibly. AI-generated content can be inaccurate.
        </p>
      </section>
    </main>
  );
}
