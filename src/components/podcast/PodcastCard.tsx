"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";

import { useAudio } from "@/providers/AudioProvider";
import { cn, formatCount, formatTime } from "@/lib/utils";
import { toAudioTrack, type Podcast } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import Equalizer from "./Equalizer";

export default function PodcastCard({ podcast, priority }: { podcast: Podcast; priority?: boolean }) {
  const { track, isPlaying, toggle } = useAudio();
  const isCurrent = track?.podcastId === podcast._id;

  return (
    <article className="group relative flex flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black-2">
        <Link href={`/podcast/${podcast._id}`} aria-label={podcast.podcastTitle}>
          <Image
            src={podcast.imageUrl || "/images/player1.png"}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        {podcast.audioDuration > 0 && (
          <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white-1 backdrop-blur-sm">
            {formatTime(podcast.audioDuration)}
          </span>
        )}
        <button
          type="button"
          onClick={() => toggle(toAudioTrack(podcast))}
          aria-label={isCurrent && isPlaying ? `Pause ${podcast.podcastTitle}` : `Play ${podcast.podcastTitle}`}
          className={cn(
            "flex-center absolute bottom-2 right-2 size-11 rounded-full bg-violet-600 text-white-1 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-violet-500 focus-visible:translate-y-0 focus-visible:opacity-100",
            isCurrent ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          )}
        >
          {isCurrent && isPlaying ? <Pause className="size-5" fill="currentColor" /> : <Play className="ml-0.5 size-5" fill="currentColor" />}
        </button>
      </div>
      <Link href={`/podcast/${podcast._id}`} className="flex flex-col gap-0.5">
        <h3 className="flex items-center gap-2 text-16 font-bold text-white-1">
          {isCurrent && <Equalizer paused={!isPlaying} className="shrink-0" />}
          <span className="truncate">{podcast.podcastTitle}</span>
        </h3>
        <p className="truncate text-12 text-white-4">
          {podcast.author} · {formatCount(podcast.views)} {podcast.views === 1 ? "play" : "plays"}
        </p>
      </Link>
    </article>
  );
}

export function PodcastCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function PodcastGrid({ podcasts, loading, skeletons = 8 }: { podcasts?: Podcast[]; loading?: boolean; skeletons?: number }) {
  if (loading || !podcasts) {
    return (
      <div className="podcast_grid">
        {Array.from({ length: skeletons }, (_, i) => (
          <PodcastCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="podcast_grid">
      {podcasts.map((podcast, index) => (
        <PodcastCard key={podcast._id} podcast={podcast} priority={index < 4} />
      ))}
    </div>
  );
}
