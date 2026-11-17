"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Headphones, Mic, Plus } from "lucide-react";

import { api } from "@convex/_generated/api";
import { formatCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function greeting(hour: number) {
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Personal header for signed-in users: greeting, their stats and a quick create action. */
export default function WelcomeBack({ userId, firstName }: { userId: string; firstName: string }) {
  const mine = useQuery(api.podcasts.getPodcastByAuthorId, { authorId: userId });
  // The greeting depends on the visitor's clock, so compute it after mount to avoid hydration mismatches.
  const [hello, setHello] = useState("Welcome back");
  useEffect(() => setHello(greeting(new Date().getHours())), []);

  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-black-1 bg-hero-glow p-6 ring-1 ring-white/5 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-24 font-extrabold tracking-tight text-white-1 sm:text-32">
            {hello}, {firstName} 👋
          </h1>
          <p className="text-16 text-white-2">What will you create today?</p>
          {mine && mine.podcasts.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              <li className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-12 font-semibold text-white-2">
                <Mic className="size-3.5 text-violet-300" /> {mine.podcasts.length}{" "}
                {mine.podcasts.length === 1 ? "podcast" : "podcasts"}
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-12 font-semibold text-white-2">
                <Headphones className="size-3.5 text-violet-300" /> {formatCount(mine.listeners)} total plays
              </li>
            </ul>
          )}
        </div>
        <div className="flex gap-3">
          <Button asChild className="h-11 gap-2 rounded-full bg-violet-600 px-5 font-bold hover:bg-violet-500">
            <Link href="/create-podcast">
              <Plus className="size-4" /> New podcast
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-white/10 bg-transparent px-5 font-bold text-white-1 hover:bg-white/5 hover:text-white-1"
          >
            <Link href={`/profile/${userId}`}>My podcasts</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
