import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { displayNameFrom, getUserByClerkId, requireIdentity } from "./lib/auth";
import { deletePodcastCascade, deleteUserActivity, syncAuthorOnPodcasts } from "./lib/cleanup";

/** Fields that are safe to show publicly. Emails are never returned. */
const toPublicUser = (user: Doc<"users">) => ({
  _id: user._id,
  clerkId: user.clerkId,
  name: user.name,
  imageUrl: user.imageUrl,
});

/**
 * Called by the client after sign-in. Creates the user record if needed and
 * keeps the name and avatar in sync with Clerk, without relying on the webhook.
 */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const name = displayNameFrom(identity);
    const imageUrl = identity.pictureUrl ?? "";
    const email = identity.email ?? "";

    const existing = await getUserByClerkId(ctx, identity.subject);
    if (!existing) {
      return await ctx.db.insert("users", {
        clerkId: identity.subject,
        name,
        imageUrl,
        email,
      });
    }

    const updates: Partial<Doc<"users">> = {};
    if (identity.name && existing.name !== name) updates.name = name;
    if (imageUrl && existing.imageUrl !== imageUrl) updates.imageUrl = imageUrl;
    if (email && existing.email !== email) updates.email = email;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(existing._id, updates);
      if (updates.name || updates.imageUrl) {
        await syncAuthorOnPodcasts(ctx, existing.clerkId, {
          name: updates.name ?? existing.name,
          imageUrl: updates.imageUrl ?? existing.imageUrl,
        });
      }
    }
    return existing._id;
  },
});

/** Public profile by Clerk id. Returns null (instead of throwing) when the user does not exist. */
export const getUserById = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId);
    return user ? toPublicUser(user) : null;
  },
});

/** Creators ranked by podcast count, with their latest podcast for the "Fans like you" carousel. */
export const getTopUserByPodcastCount = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(200);

    const ranked = await Promise.all(
      users.map(async (user) => {
        const podcasts = await ctx.db
          .query("podcasts")
          .withIndex("by_authorId", (q) => q.eq("authorId", user.clerkId))
          .order("desc")
          .collect();
        const latest = podcasts[0];
        return {
          ...toPublicUser(user),
          totalPodcasts: podcasts.length,
          totalViews: podcasts.reduce((sum, p) => sum + p.views, 0),
          latestPodcast: latest
            ? {
                podcastId: latest._id,
                podcastTitle: latest.podcastTitle,
                imageUrl: latest.imageUrl,
              }
            : null,
        };
      })
    );

    return ranked
      .filter((user) => user.totalPodcasts > 0)
      .sort((a, b) => b.totalPodcasts - a.totalPodcasts || b.totalViews - a.totalViews)
      .slice(0, 10);
  },
});

// ---------- Clerk webhook handlers (internal only) ----------

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await getUserByClerkId(ctx, args.clerkId);
    if (!existing) {
      await ctx.db.insert("users", args);
      return;
    }
    await ctx.db.patch(existing._id, {
      email: args.email,
      imageUrl: args.imageUrl,
      name: args.name,
    });
    await syncAuthorOnPodcasts(ctx, args.clerkId, {
      name: args.name,
      imageUrl: args.imageUrl,
    });
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const podcasts = await ctx.db
      .query("podcasts")
      .withIndex("by_authorId", (q) => q.eq("authorId", args.clerkId))
      .collect();
    for (const podcast of podcasts) {
      await deletePodcastCascade(ctx, podcast);
    }
    await deleteUserActivity(ctx, args.clerkId);

    const user = await getUserByClerkId(ctx, args.clerkId);
    if (user) await ctx.db.delete(user._id);
  },
});
