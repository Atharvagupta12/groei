// Text-to-speech with Deepgram Aura-2.
// Docs: https://developers.deepgram.com/docs/text-to-speech
// Setup: a free account comes with $200 of credit and needs no card. Then run
//   npx convex env set DEEPGRAM_API_KEY <key>

import { ConvexError } from "convex/values";
import { chunkText, concatBytes, fetchWithTimeout, sleep } from "./net";

const MAX_CHARS_PER_REQUEST = 1900; // Deepgram's limit is 2000

export const isVoiceConfigured = () => Boolean(process.env.DEEPGRAM_API_KEY);

async function speakChunk(text: string, model: string, apiKey: string): Promise<Uint8Array> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetchWithTimeout(
      `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3`,
      {
        method: "POST",
        headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }
    );

    if (response.ok) return new Uint8Array(await response.arrayBuffer());

    const detail = await response.text().catch(() => "");
    console.error(`Deepgram ${model} failed (${response.status}): ${detail.slice(0, 300)}`);

    // 429 means too many requests in flight; 5xx is a transient server error. Back off and retry.
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    if (response.status === 401 || response.status === 403) {
      throw new ConvexError("The voice service rejected the API key. Check DEEPGRAM_API_KEY.");
    }
    if (response.status === 402) {
      throw new ConvexError("The voice service has run out of credit.");
    }
    if (response.status === 429) {
      throw new ConvexError("The voice service is busy right now. Please try again in a moment.");
    }
    throw new ConvexError("Voice generation failed. Please try again.");
  }
  throw new ConvexError("Voice generation failed. Please try again.");
}

/** Generates MP3 speech. Long scripts are synthesized in chunks; MP3 frames concatenate cleanly. */
export async function synthesizeSpeech(text: string, model: string): Promise<Uint8Array> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new ConvexError(
      "Voice generation isn't set up yet. Add a free DEEPGRAM_API_KEY in the Convex dashboard."
    );
  }
  const parts: Uint8Array[] = [];
  for (const chunk of chunkText(text, MAX_CHARS_PER_REQUEST)) {
    parts.push(await speakChunk(chunk, model, apiKey));
  }
  return concatBytes(parts);
}
