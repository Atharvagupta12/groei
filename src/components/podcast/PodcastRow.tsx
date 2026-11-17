"use client";

import Image from "next/image";
import Link from "next/link";
import { Headphones, Pause, Play } from "lucide-react";

import { useAudio } from "@/providers/AudioProvider";
import { formatCount, formatTime } from "@/lib/utils";
import { toAudioTrack, type Podcast } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import Equalizer from "./Equalizer";

/** Compact list row used for "Latest podcasts". */
export default function PodcastRow({ podcast, index }: { podcast: Podcast; index: number }) {
  const { track, isPlaying, toggle } = useAudio();
  const isCurrent = track?.podcastId === podcast._id;

  return (
    <li className="group flex items-center gap-4 rounded-lg px-2 py-2 transition-colors hover:bg-black-1">
      <span className="flex w-6 shrink-0 justify-center text-14 font-bold text-white-3">
        {isCurrent ? <Equalizer paused={!isPlaying} /> : index + 1}
      </span>
      <Link href={`/podcast/${podcast._id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Image
          src={podcast.imageUrl || "/images/player1.png"}
          width={52}
          height={52}
          alt=""
          className="aspect-square shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0">
          <h3 className="truncate text-14 font-bold text-white-1">{podcast.podcastTitle}</h3>
          <p className="truncate text-12 text-white-3">{podcast.author}</p>
        </div>
      </Link>
      <span className="hidden items-center gap-1.5 text-12 text-white-3 sm:flex">
        <Headphones className="size-4" /> {formatCount(podcast.views)}
      </span>
      <span className="hidden w-12 text-right text-12 text-white-3 sm:block">
        {formatTime(podcast.audioDuration)}
      </span>
      <button
        type="button"
        onClick={() => toggle(toAudioTrack(podcast))}
        aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
        className="flex-center size-9 shrink-0 rounded-full bg-black-2 text-white-1 transition-colors hover:bg-violet-600"
      >
        {isCurrent && isPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
      </button>
    </li>
  );
}

export function PodcastRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-2 py-2">
      <Skeleton className="h-4 w-6" />
      <Skeleton className="size-[52px] rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="size-9 rounded-full" />
    </div>
  );
}
