"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Mic, Sparkles, Wand2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import { PodcastGrid } from "@/components/podcast/PodcastCard";
import PodcastRow, { PodcastRowSkeleton } from "@/components/podcast/PodcastRow";
import WelcomeBack from "@/components/home/WelcomeBack";
import { Skeleton } from "@/components/ui/skeleton";

function Hero() {
  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-black-1 bg-hero-glow p-6 ring-1 ring-white/5 sm:p-10">
      <div className="flex max-w-xl flex-col gap-4">
        <span className="flex w-fit items-center gap-2 rounded-full bg-violet-600/20 px-3 py-1 text-12 font-semibold text-violet-200">
          <Sparkles className="size-3.5" /> AI-powered podcast studio
        </span>
        <h1 className="text-32 font-extrabold tracking-tight text-white-1 sm:text-[40px]">
          Turn any idea into a podcast in minutes.
        </h1>
        <p className="text-16 text-white-2">
          AI writes the script, a natural voice reads it, and you get cover art too. Then publish
          and share.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild className="gap-2 bg-violet-600 px-5 font-bold hover:bg-violet-500">
            <Link href="/create-podcast">
              <Mic className="size-4" /> Create a podcast
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 border-white/10 bg-transparent font-bold text-white-1 hover:bg-white/5 hover:text-white-1">
            <Link href="/discover">
              <Wand2 className="size-4" /> Explore podcasts
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const trending = useQuery(api.podcasts.getTrendingPodcasts, { limit: 8 });
  const latest = useQuery(api.podcasts.getLatestPodcasts, { limit: 6 });
  const { user, isLoaded } = useUser();

  const isEmpty = trending !== undefined && trending.length === 0;

  return (
    <div className="flex flex-col gap-10">
      {!isLoaded ? (
        <Skeleton className="mt-6 h-[200px] w-full rounded-2xl" />
      ) : user ? (
        <WelcomeBack userId={user.id} firstName={user.firstName || user.username || "creator"} />
      ) : (
        <Hero />
      )}

      {isEmpty ? (
        <EmptyState
          title="No podcasts yet"
          description="Be the first to publish an AI podcast on Groei."
          buttonText="Create the first podcast"
          buttonLink="/create-podcast"
        />
      ) : (
        <>
          <section className="flex flex-col gap-5">
            <SectionHeader title="Trending podcasts" href="/discover" />
            <PodcastGrid podcasts={trending} />
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeader title="Latest podcasts" href="/discover" />
            {latest === undefined ? (
              <div className="flex flex-col">
                {Array.from({ length: 4 }, (_, i) => (
                  <PodcastRowSkeleton key={i} />
                ))}
              </div>
            ) : (
              <ol className="flex flex-col">
                {latest.map((podcast, index) => (
                  <PodcastRow key={podcast._id} podcast={podcast} index={index} />
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
