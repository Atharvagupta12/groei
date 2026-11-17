import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireIdentity } from "./lib/auth";
import { bumpCounter } from "./lib/cleanup";

/** Like count, and whether the current visitor liked the podcast (always false when signed out). */
export const getLikeStatus = query({
  args: { podcastId: v.id("podcasts") },
  handler: async (ctx, { podcastId }) => {
    const podcast = await ctx.db.get(podcastId);
    const count = podcast?.likeCount ?? 0;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { liked: false, count };

    const like = await ctx.db
      .query("likes")
      .withIndex("by_podcast_user", (q) => q.eq("podcastId", podcastId).eq("userId", identity.subject))
      .unique();
    return { liked: like !== null, count };
  },
});

/** Likes or unlikes a podcast. Returns the new state. */
export const toggleLike = mutation({
  args: { podcastId: v.id("podcasts") },
  handler: async (ctx, { podcastId }) => {
    const identity = await requireIdentity(ctx);
    const podcast = await ctx.db.get(podcastId);
    if (!podcast) throw new ConvexError("Podcast not found.");

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_podcast_user", (q) => q.eq("podcastId", podcastId).eq("userId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await bumpCounter(ctx, podcastId, "likeCount", -1);
      return { liked: false };
    }
    await ctx.db.insert("likes", { podcastId, userId: identity.subject });
    await bumpCounter(ctx, podcastId, "likeCount", 1);
    return { liked: true };
  },
});

/** The signed-in user's liked podcasts, newest like first. */
export const getMyLikedPodcasts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(48);
    const podcasts = await Promise.all(likes.map((like) => ctx.db.get(like.podcastId)));
    return podcasts.filter((p): p is Doc<"podcasts"> => p !== null);
  },
});
