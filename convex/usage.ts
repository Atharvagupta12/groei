import { ConvexError, v } from "convex/values";

import { internalMutation, query, type QueryCtx } from "./_generated/server";
import { LIMITS } from "./lib/voices";

export type UsageKind = keyof typeof LIMITS.daily;

const usageKind = v.union(v.literal("voiceChars"), v.literal("images"), v.literal("scripts"));

const today = () => new Date().toISOString().slice(0, 10);

async function getRow(ctx: QueryCtx, userId: string, kind: string) {
  return await ctx.db
    .query("usage")
    .withIndex("by_user_day_kind", (q) =>
      q.eq("userId", userId).eq("day", today()).eq("kind", kind)
    )
    .unique();
}

const ERROR_MESSAGES: Record<UsageKind, string> = {
  voiceChars: "You've reached today's voice generation limit. Please come back tomorrow.",
  images: "You've reached today's thumbnail generation limit. You can still upload an image.",
  scripts: "You've reached today's AI script limit.",
};

/** Reserves quota before calling the AI provider. Throws when the daily limit would be exceeded. */
export const consume = internalMutation({
  args: { userId: v.string(), kind: usageKind, amount: v.number() },
  handler: async (ctx, { userId, kind, amount }) => {
    const limit = LIMITS.daily[kind];
    const row = await getRow(ctx, userId, kind);
    const used = row?.amount ?? 0;
    if (used + amount > limit) {
      throw new ConvexError(ERROR_MESSAGES[kind]);
    }
    if (row) await ctx.db.patch(row._id, { amount: used + amount });
    else await ctx.db.insert("usage", { userId, day: today(), kind, amount });
  },
});

/** Gives quota back when the provider call fails. */
export const refund = internalMutation({
  args: { userId: v.string(), kind: usageKind, amount: v.number() },
  handler: async (ctx, { userId, kind, amount }) => {
    const row = await getRow(ctx, userId, kind);
    if (row) await ctx.db.patch(row._id, { amount: Math.max(0, row.amount - amount) });
  },
});

/** Remaining quota for the signed-in user, shown in the create page UI. */
export const getMyUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const kinds = Object.keys(LIMITS.daily) as UsageKind[];
    const entries = await Promise.all(
      kinds.map(async (kind) => {
        const row = await getRow(ctx, identity.subject, kind);
        return [kind, { used: row?.amount ?? 0, limit: LIMITS.daily[kind] }] as const;
      })
    );
    return Object.fromEntries(entries) as Record<UsageKind, { used: number; limit: number }>;
  },
});
