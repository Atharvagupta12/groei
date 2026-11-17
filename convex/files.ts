import { ConvexError, v } from "convex/values";

import { internalMutation, mutation } from "./_generated/server";
import { requireIdentity } from "./lib/auth";
import { deleteStoredFile } from "./lib/cleanup";
import { LIMITS } from "./lib/voices";

/** Short-lived upload URL for a custom thumbnail. Signed-in users only. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Called after a client upload finishes. Checks the file's type and size and
 * records the uploader as its owner so it can be attached to a podcast.
 */
export const registerUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const identity = await requireIdentity(ctx);

    const meta = await ctx.db.system.get(storageId);
    if (!meta) throw new ConvexError("Upload not found.");

    const existing = await ctx.db
      .query("files")
      .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
      .unique();
    if (existing) throw new ConvexError("This file has already been registered.");

    const isImage = meta.contentType?.startsWith("image/") ?? false;
    if (!isImage || meta.size > LIMITS.imageUploadMaxBytes) {
      await ctx.storage.delete(storageId);
      throw new ConvexError("Please upload a PNG, JPG, WEBP or GIF image under 5 MB.");
    }

    await ctx.db.insert("files", { storageId, ownerId: identity.subject, kind: "image" });
    const url = await ctx.storage.getUrl(storageId);
    return { storageId, url: url! };
  },
});

/** Deletes a generated or uploaded file the user has decided not to use. */
export const discardFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const identity = await requireIdentity(ctx);
    const record = await ctx.db
      .query("files")
      .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
      .unique();
    if (!record || record.ownerId !== identity.subject || record.podcastId) return;
    await deleteStoredFile(ctx, storageId);
  },
});

export const registerGenerated = internalMutation({
  args: {
    storageId: v.id("_storage"),
    ownerId: v.string(),
    kind: v.union(v.literal("audio"), v.literal("image")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("files", args);
  },
});

/** Hourly cron: removes generated or uploaded files that were never attached to a podcast within 24 hours. */
export const cleanupOrphans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const orphans = await ctx.db
      .query("files")
      .withIndex("by_podcastId", (q) => q.eq("podcastId", undefined))
      .filter((q) => q.lt(q.field("_creationTime"), cutoff))
      .take(100);
    for (const orphan of orphans) {
      await deleteStoredFile(ctx, orphan.storageId);
    }
    return orphans.length;
  },
});
