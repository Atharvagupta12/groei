// AI generation actions.
//   Voice:            Deepgram Aura-2 (DEEPGRAM_API_KEY)
//   Images, scripts:  Cloudflare Workers AI if configured, otherwise Pollinations (no key)
// Every action requires sign-in and spends from the caller's daily quota. Generated
// files go straight to Convex storage, so audio and images never pass through the browser.

import { ConvexError, v } from "convex/values";

import {
  action,
  internalMutation,
  internalQuery,
  query,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { isVoiceConfigured, synthesizeSpeech } from "./lib/deepgram";
import { activeProvider, generateImage, generateText } from "./lib/providers";
import { getVoice, LIMITS } from "./lib/voices";
import type { UsageKind } from "./usage";

/** Which AI features are available. The create page uses this to explain missing setup up front. */
export const getAiStatus = query({
  args: {},
  handler: async () => ({
    voice: isVoiceConfigured(),
    imageAndTextProvider: activeProvider(),
  }),
});

async function withQuota<T>(
  ctx: ActionCtx,
  userId: string,
  kind: UsageKind,
  amount: number,
  work: () => Promise<T>
): Promise<T> {
  await ctx.runMutation(internal.usage.consume, { userId, kind, amount });
  try {
    return await work();
  } catch (error) {
    await ctx.runMutation(internal.usage.refund, { userId, kind, amount });
    if (error instanceof ConvexError) throw error;
    console.error(error);
    throw new ConvexError("Generation failed. Please try again.");
  }
}

async function requireUserId(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("You need to be signed in to do that.");
  return identity.subject;
}

async function storeGenerated(
  ctx: ActionCtx,
  ownerId: string,
  bytes: Uint8Array,
  kind: "audio" | "image",
  contentType: string
) {
  const storageId: Id<"_storage"> = await ctx.storage.store(
    new Blob([bytes as BlobPart], { type: contentType })
  );
  await ctx.runMutation(internal.files.registerGenerated, { storageId, ownerId, kind });
  const url = await ctx.storage.getUrl(storageId);
  return { storageId, url: url! };
}

export const generateAudio = action({
  args: { voiceId: v.string(), text: v.string() },
  handler: async (ctx, { voiceId, text }) => {
    const userId = await requireUserId(ctx);
    const voice = getVoice(voiceId);
    if (!voice) throw new ConvexError("Please choose a voice.");

    const script = text.trim();
    if (!script) throw new ConvexError("Write a script first.");
    if (script.length > LIMITS.scriptMaxChars) {
      throw new ConvexError(`Scripts can be at most ${LIMITS.scriptMaxChars} characters.`);
    }

    return await withQuota(ctx, userId, "voiceChars", script.length, async () => {
      const audio = await synthesizeSpeech(script, voice.model);
      return await storeGenerated(ctx, userId, audio, "audio", "audio/mpeg");
    });
  },
});

export const generateThumbnail = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const userId = await requireUserId(ctx);
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 3) throw new ConvexError("Describe the thumbnail you want.");
    if (cleanPrompt.length > LIMITS.imagePromptMax) {
      throw new ConvexError(`Prompts can be at most ${LIMITS.imagePromptMax} characters.`);
    }

    return await withQuota(ctx, userId, "images", 1, async () => {
      const image = await generateImage(
        `${cleanPrompt}. Square podcast cover art, high quality, vibrant, no text, no letters.`
      );
      return await storeGenerated(ctx, userId, image.bytes, "image", image.contentType);
    });
  },
});

const LENGTH_GUIDE = {
  short: "about 120 words (under 1 minute)",
  medium: "about 300 words (about 2 minutes)",
  long: "about 600 words (about 4 minutes)",
} as const;

export const generateScript = action({
  args: {
    topic: v.string(),
    tone: v.optional(v.string()),
    length: v.union(v.literal("short"), v.literal("medium"), v.literal("long")),
  },
  handler: async (ctx, { topic, tone, length }) => {
    const userId = await requireUserId(ctx);
    const cleanTopic = topic.trim().slice(0, 300);
    if (cleanTopic.length < 3) throw new ConvexError("Describe what the episode is about.");

    return await withQuota(ctx, userId, "scripts", 1, async () => {
      const script = await generateText(
        "You are an award-winning podcast scriptwriter. Write a single-host podcast script meant to be read aloud by a text-to-speech voice. " +
          "Output ONLY the spoken words: no titles, no speaker labels, no stage directions, no markdown, no emojis, no sound-effect cues. " +
          "Open with a hook, deliver clear and engaging content, and close with a short sign-off.",
        `Topic: ${cleanTopic}\nTone: ${tone?.trim() || "conversational and upbeat"}\nLength: ${LENGTH_GUIDE[length]}`,
        length === "long" ? 1400 : 900
      );
      return cleanScript(script);
    });
  },
});

/** Strips formatting that would sound wrong when read aloud. */
function cleanScript(script: string) {
  return script
    .replace(/^\s*#+\s.*$/gm, "") // markdown headings
    .replace(/\*\*|__|\*/g, "") // bold/italics markers
    .replace(/^\s*(host|narrator|speaker\s*\d*)\s*:\s*/gim, "") // speaker labels
    .replace(/\[[^\]]*\]/g, "") // [cues]
    .replace(/\((?:[^)]*\b(?:music|sfx|sound|pause|intro|outro)\b[^)]*)\)/gi, "") // (music) notes
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, LIMITS.scriptMaxChars);
}

export const suggestImagePrompt = action({
  args: { title: v.string(), description: v.string() },
  handler: async (ctx, { title, description }) => {
    const userId = await requireUserId(ctx);
    if (!title.trim() && !description.trim()) {
      throw new ConvexError("Add a title or description first.");
    }
    return await withQuota(ctx, userId, "scripts", 1, async () => {
      const prompt = await generateText(
        "You write prompts for an AI image generator. Reply with ONE vivid visual description (max 60 words) for a podcast cover. No quotes, no text in the image, no preamble.",
        `Podcast title: ${title.trim().slice(0, 100)}\nDescription: ${description.trim().slice(0, 400)}`,
        150
      );
      return prompt.replace(/^["'\s]+|["'\s]+$/g, "").slice(0, LIMITS.imagePromptMax);
    });
  },
});

// ---------- voice previews (generated once per voice, then cached for everyone) ----------

export const getCachedPreview = internalQuery({
  args: { voiceId: v.string() },
  handler: async (ctx, { voiceId }) => {
    return await ctx.db
      .query("voicePreviews")
      .withIndex("by_voiceId", (q) => q.eq("voiceId", voiceId))
      .first();
  },
});

export const saveVoicePreview = internalMutation({
  args: { voiceId: v.string(), storageId: v.id("_storage"), url: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("voicePreviews")
      .withIndex("by_voiceId", (q) => q.eq("voiceId", args.voiceId))
      .first();
    if (existing) {
      await ctx.storage.delete(args.storageId); // lost a race; keep the first one
      return existing.url;
    }
    await ctx.db.insert("voicePreviews", args);
    return args.url;
  },
});

const PREVIEW_TEXT =
  "Hi there! I'll be the voice of your podcast. Let's make something people love to listen to.";

export const getVoicePreview = action({
  args: { voiceId: v.string() },
  handler: async (ctx, { voiceId }): Promise<string> => {
    const voice = getVoice(voiceId);
    if (!voice) throw new ConvexError("Unknown voice.");

    const cached = await ctx.runQuery(internal.ai.getCachedPreview, { voiceId });
    if (cached) return cached.url;

    // Only signed-in users can trigger a new (paid) preview generation.
    await requireUserId(ctx);
    const audio = await synthesizeSpeech(PREVIEW_TEXT, voice.model);
    const storageId = await ctx.storage.store(new Blob([audio as BlobPart], { type: "audio/mpeg" }));
    const url = (await ctx.storage.getUrl(storageId))!;
    return await ctx.runMutation(internal.ai.saveVoicePreview, { voiceId, storageId, url });
  },
});
