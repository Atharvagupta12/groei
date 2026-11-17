import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { mutation, query } from "./_generated/server";
import { getOrCreateCurrentUser, requireIdentity } from "./lib/auth";
import { bumpCounter } from "./lib/cleanup";
import { LIMITS } from "./lib/voices";

const COMMENT_MAX_CHARS = LIMITS.commentMax;
const MIN_SECONDS_BETWEEN_COMMENTS = 5;

/** Comments on a podcast, newest first, with each author's current name and avatar. */
export const listComments = query({
  args: { podcastId: v.id("podcasts"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { podcastId, paginationOpts }) => {
    const result = await ctx.db
      .query("comments")
      .withIndex("by_podcast", (q) => q.eq("podcastId", podcastId))
      .order("desc")
      .paginate(paginationOpts);

    const page = await Promise.all(
      result.page.map(async (comment) => {
        const author = await ctx.db.get(comment.user);
        return {
          _id: comment._id,
          _creationTime: comment._creationTime,
          body: comment.body,
          authorId: comment.authorId,
          authorName: author?.name ?? "Deleted user",
          authorImageUrl: author?.imageUrl ?? "",
        };
      })
    );
    return { ...result, page };
  },
});

export const addComment = mutation({
  args: { podcastId: v.id("podcasts"), body: v.string() },
  handler: async (ctx, { podcastId, body }) => {
    const user = await getOrCreateCurrentUser(ctx);
    const podcast = await ctx.db.get(podcastId);
    if (!podcast) throw new ConvexError("Podcast not found.");

    const text = body.trim().replace(/\n{3,}/g, "\n\n");
    if (!text) throw new ConvexError("Write something first.");
    if (text.length > COMMENT_MAX_CHARS) {
      throw new ConvexError(`Comments can be at most ${COMMENT_MAX_CHARS} characters.`);
    }

    // Simple anti-spam rule: one comment every few seconds per user.
    const last = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", user.clerkId))
      .order("desc")
      .first();
    if (last && Date.now() - last._creationTime < MIN_SECONDS_BETWEEN_COMMENTS * 1000) {
      throw new ConvexError("You're commenting too fast. Please wait a moment.");
    }

    const commentId = await ctx.db.insert("comments", {
      podcastId,
      user: user._id,
      authorId: user.clerkId,
      body: text,
    });
    await bumpCounter(ctx, podcastId, "commentCount", 1);
    return commentId;
  },
});

/** Comment authors can delete their own comments. Podcast owners can moderate any comment on their podcast. */
export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const identity = await requireIdentity(ctx);
    const comment = await ctx.db.get(commentId);
    if (!comment) return;

    const podcast = await ctx.db.get(comment.podcastId);
    const isAuthor = comment.authorId === identity.subject;
    const isPodcastOwner = podcast?.authorId === identity.subject;
    if (!isAuthor && !isPodcastOwner) {
      throw new ConvexError("You can't delete this comment.");
    }

    await ctx.db.delete(commentId);
    await bumpCounter(ctx, comment.podcastId, "commentCount", -1);
  },
});
