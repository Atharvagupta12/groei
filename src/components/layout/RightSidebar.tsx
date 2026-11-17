"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SectionHeader from "@/components/shared/SectionHeader";
import FansLikeYouCarousel from "./FansLikeYouCarousel";

export default function RightSidebar() {
  const { user } = useUser();
  const topPodcasters = useQuery(api.users.getTopUserByPodcastCount);

  return (
    <aside className="right_sidebar no-scrollbar text-white-1">
      <SignedIn>
        <div className="flex items-center gap-3 pb-10">
          <UserButton />
          <Link
            href={user ? `/profile/${user.id}` : "#"}
            className="flex min-w-0 flex-1 items-center justify-between rounded-md hover:text-violet-300"
          >
            <span className="truncate text-16 font-semibold">
              {user?.fullName || user?.username || "My profile"}
            </span>
            <ChevronRight className="size-5 shrink-0" />
          </Link>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="mb-10 flex flex-col gap-3 rounded-xl bg-hero-glow p-5 ring-1 ring-violet-600/30">
          <Sparkles className="size-6 text-violet-300" />
          <h2 className="text-16 font-bold">Create your own AI podcast</h2>
          <p className="text-12 text-white-2">
            Write or generate a script, pick a voice and publish in minutes. Free.
          </p>
          <Button asChild className="mt-1 bg-violet-600 font-bold hover:bg-violet-500">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </SignedOut>

      <section className="flex flex-col gap-5">
        <SectionHeader title="Fans like you" href="/discover" />
        {topPodcasters === undefined ? (
          <Skeleton className="aspect-square w-full rounded-xl" />
        ) : topPodcasters.length === 0 ? (
          <p className="text-14 text-white-3">New creators will show up here.</p>
        ) : (
          <FansLikeYouCarousel podcasters={topPodcasters} />
        )}
      </section>

      <section className="flex flex-col gap-6 pb-10 pt-12">
        <SectionHeader title="Top podcasters" />
        <div className="flex flex-col gap-5">
          {topPodcasters === undefined
            ? Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-11 rounded-lg" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            : topPodcasters.slice(0, 5).map((podcaster) => (
                <Link
                  key={podcaster._id}
                  href={`/profile/${podcaster.clerkId}`}
                  className="flex items-center justify-between gap-3 rounded-md hover:text-violet-300"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Image
                      src={podcaster.imageUrl || "/icons/avatar.svg"}
                      alt=""
                      width={44}
                      height={44}
                      className="aspect-square shrink-0 rounded-lg object-cover"
                    />
                    <span className="truncate text-14 font-semibold">{podcaster.name}</span>
                  </span>
                  <span className="shrink-0 text-12 text-white-2">
                    {podcaster.totalPodcasts} {podcaster.totalPodcasts === 1 ? "podcast" : "podcasts"}
                  </span>
                </Link>
              ))}
        </div>
      </section>
    </aside>
  );
}
