"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { BadgeCheck, Headphones, Heart, Mic, Shuffle } from "lucide-react";

import { api } from "@convex/_generated/api";
import { useAudio } from "@/providers/AudioProvider";
import { toAudioTrack } from "@/types";
import { formatCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { PodcastGrid } from "@/components/podcast/PodcastCard";

function ProfileSkeleton() {
  return (
    <div className="mt-9 flex flex-col gap-6 max-md:items-center md:flex-row">
      <Skeleton className="size-[200px] rounded-xl" />
      <div className="flex flex-col justify-center gap-3 max-md:items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-11 w-52" />
      </div>
    </div>
  );
}

export default function ProfileView({ profileId }: { profileId: string }) {
  const profile = useQuery(api.users.getUserById, { clerkId: profileId });
  const data = useQuery(api.podcasts.getPodcastByAuthorId, { authorId: profileId });
  const { user } = useUser();
  const { play } = useAudio();
  const isOwnProfile = user?.id === profileId;
  const liked = useQuery(api.likes.getMyLikedPodcasts, isOwnProfile ? {} : "skip");

  if (profile === undefined || data === undefined) return <ProfileSkeleton />;
  if (profile === null) {
    return (
      <EmptyState
        title="Creator not found"
        description="This profile doesn't exist or has been removed."
        buttonText="Discover podcasts"
        buttonLink="/discover"
      />
    );
  }

  const { podcasts, listeners } = data;

  const playRandom = () => {
    const random = podcasts[Math.floor(Math.random() * podcasts.length)];
    if (random) play(toAudioTrack(random));
  };

  return (
    <section className="flex flex-col">
      <h1 className="sr-only">{profile.name}&apos;s profile</h1>
      <div className="mt-9 flex flex-col gap-6 max-md:items-center md:flex-row">
        <Image
          src={profile.imageUrl || "/icons/avatar.svg"}
          width={200}
          height={200}
          alt=""
          priority
          className="aspect-square size-[200px] rounded-xl object-cover shadow-2xl"
        />
        <div className="flex flex-col justify-center gap-4 max-md:items-center max-md:text-center">
          <div className="flex flex-col gap-2 max-md:items-center">
            <span className="flex items-center gap-1.5 text-14 font-medium text-white-2">
              <BadgeCheck className="size-4 text-violet-400" /> Groei creator
            </span>
            <p className="text-32 font-extrabold tracking-tight text-white-1">{profile.name}</p>
          </div>
          <ul className="flex flex-wrap gap-5 text-16 max-md:justify-center">
            <li className="flex items-center gap-2">
              <Mic className="size-5 text-white-3" />
              <span className="font-semibold text-white-1">{podcasts.length}</span>
              <span className="text-white-2">{podcasts.length === 1 ? "podcast" : "podcasts"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Headphones className="size-5 text-white-3" />
              <span className="font-semibold text-white-1">{formatCount(listeners)}</span>
              <span className="text-white-2">total plays</span>
            </li>
          </ul>
          {podcasts.length > 0 && (
            <Button
              onClick={playRandom}
              className="h-11 w-fit gap-2 rounded-full bg-violet-600 px-6 font-extrabold hover:bg-violet-500"
            >
              <Shuffle className="size-4" /> Play a random podcast
            </Button>
          )}
        </div>
      </div>

      <section className="mt-12 flex flex-col gap-5">
        <h2 className="text-20 font-bold text-white-1">
          {isOwnProfile ? "Your podcasts" : "All podcasts"}
        </h2>
        {podcasts.length > 0 ? (
          <PodcastGrid podcasts={podcasts} />
        ) : isOwnProfile ? (
          <EmptyState
            title="You haven't created any podcasts yet"
            description="Your first AI podcast is only a few clicks away."
            buttonLink="/create-podcast"
            buttonText="Create a podcast"
          />
        ) : (
          <EmptyState title={`${profile.name} hasn't published any podcasts yet`} />
        )}
      </section>

      {isOwnProfile && (
        <section className="mt-12 flex flex-col gap-5">
          <h2 className="flex items-center gap-2 text-20 font-bold text-white-1">
            <Heart className="size-5 text-pink-400" fill="currentColor" /> Liked podcasts
          </h2>
          {liked && liked.length === 0 ? (
            <p className="text-14 text-white-3">
              Podcasts you like will show up here. Tap the ♥ on any episode.
            </p>
          ) : (
            <PodcastGrid podcasts={liked} skeletons={4} />
          )}
        </section>
      )}
    </section>
  );
}
