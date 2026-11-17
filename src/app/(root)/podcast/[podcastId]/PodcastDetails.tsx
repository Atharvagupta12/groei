"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Clock, Headphones, MessageCircle, Mic2, Pause, Play, Share2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { voiceLabel } from "@convex/lib/voices";
import { useAudio } from "@/providers/AudioProvider";
import { toAudioTrack } from "@/types";
import { formatCount, formatTime, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import EmptyState from "@/components/shared/EmptyState";
import SectionHeader from "@/components/shared/SectionHeader";
import { PodcastGrid } from "@/components/podcast/PodcastCard";
import OwnerMenu from "@/components/podcast/OwnerMenu";
import Equalizer from "@/components/podcast/Equalizer";
import LikeButton from "@/components/podcast/LikeButton";
import CommentsSection from "@/components/podcast/CommentsSection";

function DetailSkeleton() {
  return (
    <div className="mt-9 flex flex-col gap-8 md:flex-row">
      <Skeleton className="aspect-square w-full max-w-[250px] rounded-xl max-md:mx-auto" />
      <div className="flex flex-1 flex-col gap-4 max-md:items-center">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-4 h-11 w-48" />
      </div>
    </div>
  );
}

function ExpandableText({ text, limit = 420 }: { text: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > limit;
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="whitespace-pre-line text-16 leading-relaxed text-white-2">
        {isLong && !expanded ? `${text.slice(0, limit).trimEnd()}…` : text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-14 font-semibold text-violet-400 hover:text-violet-300"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

async function share(title: string) {
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, text: `Listen to "${title}" on Groei`, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  } catch (error) {
    if ((error as DOMException)?.name !== "AbortError") {
      toast({ title: "Couldn't share this link", variant: "destructive" });
    }
  }
}

export default function PodcastDetails({ podcastId }: { podcastId: string }) {
  const podcast = useQuery(api.podcasts.getPodcastById, { podcastId });
  const similar = useQuery(api.podcasts.getPodcastByVoiceType, { podcastId });
  const { user } = useUser();
  const { track, isPlaying, toggle } = useAudio();
  const [isDeleting, setIsDeleting] = useState(false);

  if (podcast === undefined || isDeleting) return <DetailSkeleton />;
  if (podcast === null) {
    return (
      <EmptyState
        title="Podcast not found"
        description="This podcast may have been deleted, or the link is incorrect."
        buttonText="Discover podcasts"
        buttonLink="/discover"
      />
    );
  }

  const isOwner = user?.id === podcast.authorId;
  const isCurrent = track?.podcastId === podcast._id;

  return (
    <section className="flex w-full flex-col">
      <div className="mt-9 flex flex-col gap-8 md:flex-row">
        <div className="relative mx-auto aspect-square w-full max-w-[250px] shrink-0 overflow-hidden rounded-xl bg-black-2 shadow-2xl md:mx-0">
          <Image
            src={podcast.imageUrl}
            alt={`${podcast.podcastTitle} cover`}
            fill
            priority
            sizes="250px"
            className="object-cover"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 max-md:items-center max-md:text-center">
          <div className="flex flex-col gap-3 max-md:items-center">
            <div className="flex items-start justify-between gap-4">
              <h1 className="break-words text-32 font-extrabold tracking-tight text-white-1">
                {podcast.podcastTitle}
              </h1>
              {isOwner && (
                <OwnerMenu
                  podcast={podcast}
                  onDeleteStart={() => setIsDeleting(true)}
                  onDeleteFailed={() => setIsDeleting(false)}
                />
              )}
            </div>
            <Link
              href={`/profile/${podcast.authorId}`}
              className="flex w-fit items-center gap-2 rounded-md hover:text-violet-300"
            >
              <Image
                src={podcast.authorImageUrl || "/icons/avatar.svg"}
                width={30}
                height={30}
                alt=""
                className="size-[30px] rounded-full object-cover"
              />
              <span className="text-16 font-semibold text-white-2">{podcast.author}</span>
            </Link>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-14 text-white-3 max-md:justify-center">
              <li className="flex items-center gap-1.5">
                <Headphones className="size-4" /> {formatCount(podcast.views)} plays
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="size-4" /> {formatTime(podcast.audioDuration)}
              </li>
              {(podcast.commentCount ?? 0) > 0 && (
                <li>
                  <a href="#comments-heading" className="flex items-center gap-1.5 hover:text-white-1">
                    <MessageCircle className="size-4" /> {formatCount(podcast.commentCount ?? 0)} comments
                  </a>
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <Mic2 className="size-4" /> {voiceLabel(podcast.voiceType)}
              </li>
              <li>{timeAgo(podcast._creationTime)}</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 max-md:justify-center">
            <Button
              onClick={() => toggle(toAudioTrack(podcast))}
              className="h-12 min-w-[180px] gap-2 rounded-full bg-orange-1 px-6 text-16 font-extrabold text-white-1 hover:bg-orange-1/90"
            >
              {isCurrent && isPlaying ? (
                <>
                  <Pause className="size-5" fill="currentColor" /> Pause
                </>
              ) : (
                <>
                  <Play className="size-5" fill="currentColor" /> {isCurrent ? "Resume" : "Play podcast"}
                </>
              )}
            </Button>
            {isCurrent && <Equalizer paused={!isPlaying} />}
            <LikeButton podcastId={podcast._id} />
            <Button
              variant="outline"
              onClick={() => share(podcast.podcastTitle)}
              className="h-12 gap-2 rounded-full border-black-5 bg-transparent px-5 font-bold text-white-1 hover:bg-black-2 hover:text-white-1"
            >
              <Share2 className="size-4" /> Share
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-18 font-bold text-white-1">About this episode</h2>
          <ExpandableText text={podcast.podcastDescription} />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-18 font-bold text-white-1">Transcript</h2>
          <ExpandableText text={podcast.voicePrompt} />
        </section>
        {podcast.imagePrompt && (
          <section className="flex flex-col gap-3">
            <h2 className="text-18 font-bold text-white-1">Cover art prompt</h2>
            <p className="text-16 text-white-2">{podcast.imagePrompt}</p>
          </section>
        )}
      </div>

      <CommentsSection
        podcastId={podcast._id}
        podcastOwnerId={podcast.authorId}
        commentCount={podcast.commentCount ?? 0}
      />

      <section className="mt-12 flex flex-col gap-5">
        <SectionHeader title="You might also like" href="/discover" />
        {similar && similar.length === 0 ? (
          <p className="text-14 text-white-3">No similar podcasts yet.</p>
        ) : (
          <PodcastGrid podcasts={similar} skeletons={4} />
        )}
      </section>
    </section>
  );
}
