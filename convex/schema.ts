import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  podcasts: defineTable({
    user: v.id("users"),
    authorId: v.string(), // Clerk user id of the author
    author: v.string(),
    authorImageUrl: v.string(),

    podcastTitle: v.string(),
    podcastDescription: v.string(),

    audioStorageId: v.id("_storage"),
    audioUrl: v.string(),
    audioDuration: v.number(),
    voiceType: v.string(),
    voicePrompt: v.string(),

    imageStorageId: v.id("_storage"),
    imageUrl: v.string(),
    imagePrompt: v.optional(v.string()),

    views: v.number(),
    // Counters stored on the podcast so lists don't have to count likes and comments
    // on every read. Optional because podcasts created before this feature don't have them.
    likeCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
  })
    .index("by_authorId", ["authorId"])
    .index("by_voiceType", ["voiceType"])
    .index("by_views", ["views"])
    .searchIndex("search_author", { searchField: "author" })
    .searchIndex("search_title", { searchField: "podcastTitle" })
    .searchIndex("search_body", { searchField: "podcastDescription" }),

  likes: defineTable({
    podcastId: v.id("podcasts"),
    userId: v.string(), // Clerk user id
  })
    .index("by_podcast_user", ["podcastId", "userId"])
    .index("by_user", ["userId"]),

  comments: defineTable({
    podcastId: v.id("podcasts"),
    user: v.id("users"),
    authorId: v.string(), // Clerk user id
    body: v.string(),
  })
    .index("by_podcast", ["podcastId"])
    .index("by_author", ["authorId"]),

  // Every file a user generates or uploads is registered here so the backend
  // can check ownership before attaching it to a podcast or deleting it.
  files: defineTable({
    storageId: v.id("_storage"),
    ownerId: v.string(), // Clerk user id
    kind: v.union(v.literal("audio"), v.literal("image")),
    podcastId: v.optional(v.id("podcasts")),
  })
    .index("by_storageId", ["storageId"])
    .index("by_podcastId", ["podcastId"]),

  // Per-user daily usage counters that keep AI generation inside the free tier.
  usage: defineTable({
    userId: v.string(),
    day: v.string(), // YYYY-MM-DD (UTC)
    kind: v.string(),
    amount: v.number(),
  }).index("by_user_day_kind", ["userId", "day", "kind"]),

  // Cached short voice samples so that voice previews are generated only once.
  voicePreviews: defineTable({
    voiceId: v.string(),
    storageId: v.id("_storage"),
    url: v.string(),
  }).index("by_voiceId", ["voiceId"]),
});
