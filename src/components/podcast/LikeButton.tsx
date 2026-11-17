"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { Heart } from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cn, formatCount, getErrorMessage } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function LikeButton({ podcastId }: { podcastId: Id<"podcasts"> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const status = useQuery(api.likes.getLikeStatus, { podcastId });
  const [burst, setBurst] = useState(0);

  // Optimistic update: the heart and count change instantly, then the server confirms.
  const toggleLike = useMutation(api.likes.toggleLike).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.likes.getLikeStatus, args);
    if (!current) return;
    store.setQuery(api.likes.getLikeStatus, args, {
      liked: !current.liked,
      count: Math.max(0, current.count + (current.liked ? -1 : 1)),
    });
  });

  const liked = status?.liked ?? false;
  const count = status?.count ?? 0;

  const handleClick = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!liked) setBurst((n) => n + 1);
    try {
      await toggleLike({ podcastId });
    } catch (error) {
      toast({ title: getErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this podcast" : "Like this podcast"}
      className={cn(
        "flex h-12 items-center gap-2 rounded-full border px-5 text-16 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
        liked
          ? "border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/15"
          : "border-black-5 text-white-1 hover:bg-black-2"
      )}
    >
      <Heart
        key={burst}
        className={cn("size-5", liked && "duration-300 animate-in zoom-in-50")}
        fill={liked ? "currentColor" : "none"}
      />
      <span className="tabular-nums">{formatCount(count)}</span>
    </button>
  );
}
