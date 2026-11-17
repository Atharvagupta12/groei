import { ConvexError } from "convex/values";
import type { UserIdentity } from "convex/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type AuthCtx = { auth: QueryCtx["auth"] };

export async function requireIdentity(ctx: AuthCtx): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("You need to be signed in to do that.");
  }
  return identity;
}

export function displayNameFrom(identity: {
  name?: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  email?: string;
}): string {
  const fullName =
    identity.name?.trim() ||
    [identity.givenName, identity.familyName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (identity.nickname?.trim()) return identity.nickname.trim();
  if (identity.email) return identity.email.split("@")[0];
  return "Groei creator";
}

export async function getUserByClerkId(
  ctx: QueryCtx,
  clerkId: string
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}

/**
 * Returns the signed-in user's document, creating it from the auth token if
 * the Clerk webhook has not created it yet. Because of this, the app keeps
 * working even when the webhook is delayed or not configured locally.
 */
export async function getOrCreateCurrentUser(
  ctx: MutationCtx
): Promise<Doc<"users">> {
  const identity = await requireIdentity(ctx);
  const existing = await getUserByClerkId(ctx, identity.subject);
  if (existing) return existing;

  const userId = await ctx.db.insert("users", {
    clerkId: identity.subject,
    email: identity.email ?? "",
    name: displayNameFrom(identity),
    imageUrl: identity.pictureUrl ?? "",
  });
  return (await ctx.db.get(userId))!;
}
