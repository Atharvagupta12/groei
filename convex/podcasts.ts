import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getOrCreateCurrentUser, requireIdentity } from "./lib/auth";
import { deletePodcastCascade } from "./lib/cleanup";
import { getVoice, LIMITS } from "./lib/voices";

// ---------- helpers ----------

function cleanText(value: string, field: string, min: number, max: number) {
  const trimmed = value.trim();
  if (trimmed.length < min) throw new ConvexError(`${field} must be at least ${min} characters.`);
  if (trimmed.length > max) throw new ConvexError(`${field} must be at most ${max} characters.`);
  return trimmed;
}

/** Checks that the signed-in user owns an unattached file of the right kind. */
async function claimFile(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
  ownerId: string,
  kind: "audio" | "image"
) {
  const record = await ctx.db
    .query("files")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .unique();
  if (!record || record.ownerId !== ownerId || record.kind !== kind) {
    throw new ConvexError(`The ${kind} file is invalid. Please generate it again.`);
  }
  if (record.podcastId) {
    throw new ConvexError(`This ${kind} is already used by another podcast.`);
  }
  const url = await ctx.storage.getUrl(storageId);
  if (!url) throw new ConvexError(`The ${kind} file has expired. Please generate it again.`);
  return { record, url };
}

async function getOwnedPodcast(ctx: MutationCtx, podcastId: Id<"podcasts">) {
  const identity = await requireIdentity(ctx);
  const podcast = await ctx.db.get(podcastId);
  if (!podcast) throw new ConvexError("Podcast not found.");
  if (podcast.authorId !== identity.subject) {
    throw new ConvexError("You can only change your own podcasts.");
  }
  return podcast;
}

// ---------- mutations ----------

export const createPodcast = mutation({
  args: {
    podcastTitle: v.string(),
    podcastDescription: v.string(),
    voiceType: v.string(),
    voicePrompt: v.string(),
    imagePrompt: v.optional(v.string()),
    audioStorageId: v.id("_storage"),
    imageStorageId: v.id("_storage"),
    audioDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateCurrentUser(ctx);

    if (!getVoice(args.voiceType)) throw new ConvexError("Unknown voice.");
    const podcastTitle = cleanText(args.podcastTitle, "Title", 2, LIMITS.titleMax);
    const podcastDescription = cleanText(
      args.podcastDescription,
      "Description",
      10,
      LIMITS.descriptionMax
    );
    const voicePrompt = cleanText(args.voicePrompt, "Script", 1, LIMITS.scriptMaxChars);

    const audio = await claimFile(ctx, args.audioStorageId, user.clerkId, "audio");
    const image = await claimFile(ctx, args.imageStorageId, user.clerkId, "image");

    const podcastId = await ctx.db.insert("podcasts", {
      user: user._id,
      authorId: user.clerkId,
      author: user.name,
      authorImageUrl: user.imageUrl,
      podcastTitle,
      podcastDescription,
      voiceType: args.voiceType,
      voicePrompt,
      imagePrompt: args.imagePrompt?.trim() || undefined,
      audioStorageId: args.audioStorageId,
      audioUrl: audio.url,
      audioDuration: Math.max(0, args.audioDuration),
      imageStorageId: args.imageStorageId,
      imageUrl: image.url,
      views: 0,
    });

    await ctx.db.patch(audio.record._id, { podcastId });
    await ctx.db.patch(image.record._id, { podcastId });
    return podcastId;
  },
});

export const updatePodcast = mutation({
  args: {
    podcastId: v.id("podcasts"),
    podcastTitle: v.string(),
    podcastDescription: v.string(),
  },
  handler: async (ctx, args) => {
    await getOwnedPodcast(ctx, args.podcastId);
    await ctx.db.patch(args.podcastId, {
      podcastTitle: cleanText(args.podcastTitle, "Title", 2, LIMITS.titleMax),
      podcastDescription: cleanText(
        args.podcastDescription,
        "Description",
        10,
        LIMITS.descriptionMax
      ),
    });
  },
});

export const deletePodcast = mutation({
  args: { podcastId: v.id("podcasts") },
  handler: async (ctx, args) => {
    const podcast = await getOwnedPodcast(ctx, args.podcastId);
    await deletePodcastCascade(ctx, podcast);
  },
});

/** Counts a listen. The client calls this at most once per podcast per browser session. */
export const updatePodcastViews = mutation({
  args: { podcastId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("podcasts", args.podcastId);
    if (!id) return;
    const podcast = await ctx.db.get(id);
    if (!podcast) return;
    await ctx.db.patch(id, { views: podcast.views + 1 });
  },
});

// ---------- queries ----------

/** Accepts any string from the URL and returns null (never throws) when it is not a valid podcast id. */
export const getPodcastById = query({
  args: { podcastId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("podcasts", args.podcastId);
    return id ? await ctx.db.get(id) : null;
  },
});

export const getTrendingPodcasts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("podcasts")
      .withIndex("by_views")
      .order("desc")
      .take(Math.min(args.limit ?? 8, 50));
  },
});

export const getLatestPodcasts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.query("podcasts").order("desc").take(Math.min(args.limit ?? 8, 50));
  },
});

export const listPodcasts = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal("latest"), v.literal("popular"))),
  },
  handler: async (ctx, args) => {
    if (args.sort === "popular") {
      return await ctx.db
        .query("podcasts")
        .withIndex("by_views")
        .order("desc")
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("podcasts").order("desc").paginate(args.paginationOpts);
  },
});

/** "Similar podcasts" means podcasts with the same voice, falling back to popular ones. */
export const getPodcastByVoiceType = query({
  args: { podcastId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("podcasts", args.podcastId);
    const podcast = id ? await ctx.db.get(id) : null;
    if (!podcast) return [];

    const sameVoice = await ctx.db
      .query("podcasts")
      .withIndex("by_voiceType", (q) => q.eq("voiceType", podcast.voiceType))
      .order("desc")
      .take(9);
    const results = sameVoice.filter((p) => p._id !== podcast._id).slice(0, 8);

    if (results.length < 4) {
      const popular = await ctx.db.query("podcasts").withIndex("by_views").order("desc").take(12);
      for (const p of popular) {
        if (results.length >= 8) break;
        if (p._id !== podcast._id && !results.some((r) => r._id === p._id)) results.push(p);
      }
    }
    return results;
  },
});

export const getPodcastByAuthorId = query({
  args: { authorId: v.string() },
  handler: async (ctx, args) => {
    const podcasts = await ctx.db
      .query("podcasts")
      .withIndex("by_authorId", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .collect();
    const listeners = podcasts.reduce((sum, podcast) => sum + podcast.views, 0);
    return { podcasts, listeners };
  },
});

/** Full-text search across title, author and description, merged and de-duplicated. */
export const getPodcastBySearch = query({
  args: { search: v.string() },
  handler: async (ctx, args) => {
    const term = args.search.trim().slice(0, 100);
    if (!term) {
      return await ctx.db.query("podcasts").order("desc").take(24);
    }

    const [byTitle, byAuthor, byBody] = await Promise.all([
      ctx.db
        .query("podcasts")
        .withSearchIndex("search_title", (q) => q.search("podcastTitle", term))
        .take(20),
      ctx.db
        .query("podcasts")
        .withSearchIndex("search_author", (q) => q.search("author", term))
        .take(20),
      ctx.db
        .query("podcasts")
        .withSearchIndex("search_body", (q) => q.search("podcastDescription", term))
        .take(20),
    ]);

    const seen = new Set<string>();
    const merged: Doc<"podcasts">[] = [];
    for (const podcast of [...byTitle, ...byAuthor, ...byBody]) {
      if (!seen.has(podcast._id)) {
        seen.add(podcast._id);
        merged.push(podcast);
      }
    }
    return merged.slice(0, 24);
  },
});
