"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex-center min-h-[60vh] flex-col gap-5 px-6 text-center">
      <div className="flex-center size-16 rounded-full bg-black-2">
        <AlertTriangle className="size-8 text-orange-1" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-24 font-bold text-white-1">Something went wrong</h1>
        <p className="text-16 text-white-2">
          We hit an unexpected error while loading this page. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="bg-violet-600 font-bold hover:bg-violet-500">
          Try again
        </Button>
        <Button asChild variant="outline" className="border-black-5 bg-transparent font-bold">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </section>
  );
}
