import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex-center min-h-screen flex-col gap-6 bg-black-3 px-6 text-center">
      <Image src="/icons/emptyState.svg" width={200} height={200} alt="" priority />
      <div className="flex flex-col gap-2">
        <h1 className="text-32 font-extrabold text-white-1">Page not found</h1>
        <p className="text-16 text-white-2">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-violet-600 px-6 py-3 text-16 font-bold text-white-1 transition-colors hover:bg-violet-500"
      >
        Back to home
      </Link>
    </main>
  );
}
