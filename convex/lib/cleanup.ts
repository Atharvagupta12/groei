import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

/** Deletes a stored file and its ownership record. Missing files are ignored. */
export async function deleteStoredFile(ctx: MutationCtx, storageId: Id<"_storage">) {
  const record = await ctx.db
    .query("files")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .unique();
  if (record) await ctx.db.delete(record._id);

  const meta = await ctx.db.system.get(storageId);
  if (meta) await ctx.storage.delete(storageId);
}

/** Deletes a podcast along with its audio, thumbnail, likes and comments. */
export async function deletePodcastCascade(ctx: MutationCtx, podcast: Doc<"podcasts">) {
  await deleteStoredFile(ctx, podcast.audioStorageId);
  await deleteStoredFile(ctx, podcast.imageStorageId);

  const likes = await ctx.db
    .query("likes")
    .withIndex("by_podcast_user", (q) => q.eq("podcastId", podcast._id))
    .collect();
  const comments = await ctx.db
    .query("comments")
    .withIndex("by_podcast", (q) => q.eq("podcastId", podcast._id))
    .collect();
  await Promise.all([...likes, ...comments].map((doc) => ctx.db.delete(doc._id)));

  await ctx.db.delete(podcast._id);
}

/** Adds delta to a podcast's like or comment counter, never going below zero. */
export async function bumpCounter(
  ctx: MutationCtx,
  podcastId: Id<"podcasts">,
  field: "likeCount" | "commentCount",
  delta: number
) {
  const podcast = await ctx.db.get(podcastId);
  if (!podcast) return;
  await ctx.db.patch(podcastId, { [field]: Math.max(0, (podcast[field] ?? 0) + delta) });
}

/** Removes a deleted user's likes and comments from other people's podcasts. */
export async function deleteUserActivity(ctx: MutationCtx, clerkId: string) {
  const likes = await ctx.db
    .query("likes")
    .withIndex("by_user", (q) => q.eq("userId", clerkId))
    .collect();
  for (const like of likes) {
    await ctx.db.delete(like._id);
    await bumpCounter(ctx, like.podcastId, "likeCount", -1);
  }

  const comments = await ctx.db
    .query("comments")
    .withIndex("by_author", (q) => q.eq("authorId", clerkId))
    .collect();
  for (const comment of comments) {
    await ctx.db.delete(comment._id);
    await bumpCounter(ctx, comment.podcastId, "commentCount", -1);
  }
}

/** Copies a user's latest name and avatar onto all of their podcasts. */
export async function syncAuthorOnPodcasts(
  ctx: MutationCtx,
  clerkId: string,
  author: { name: string; imageUrl: string }
) {
  const podcasts = await ctx.db
    .query("podcasts")
    .withIndex("by_authorId", (q) => q.eq("authorId", clerkId))
    .collect();
  await Promise.all(
    podcasts.map((podcast) =>
      ctx.db.patch(podcast._id, {
        author: author.name,
        authorImageUrl: author.imageUrl,
      })
    )
  );
}
