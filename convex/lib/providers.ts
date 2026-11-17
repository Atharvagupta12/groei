// Image and text generation with automatic fallback:
//   1. Cloudflare Workers AI (FLUX.1 schnell / Llama 3.1), if CLOUDFLARE_ACCOUNT_ID and
//      CLOUDFLARE_API_TOKEN are set (free tier: 10k neurons a day)
//   2. Pollinations.ai, which is free and needs no key, so the app works with zero setup

import { ConvexError } from "convex/values";
import { base64ToBytes, fetchWithTimeout } from "./net";

const CLOUDFLARE_MODELS = {
  text: "@cf/meta/llama-3.1-8b-instruct-fp8",
  image: "@cf/black-forest-labs/flux-1-schnell",
} as const;

export type Provider = "cloudflare" | "pollinations";

const cloudflareCredentials = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  return accountId && token ? { accountId, token } : null;
};

export const activeProvider = (): Provider => (cloudflareCredentials() ? "cloudflare" : "pollinations");

/** Runs the primary provider, then falls back to Pollinations if it fails. */
async function withFallback<T>(
  task: string,
  cloudflare: (creds: { accountId: string; token: string }) => Promise<T>,
  pollinations: () => Promise<T>
): Promise<T> {
  const creds = cloudflareCredentials();
  if (creds) {
    try {
      return await cloudflare(creds);
    } catch (error) {
      console.warn(`Cloudflare ${task} failed, falling back to Pollinations`, error);
    }
  }
  try {
    return await pollinations();
  } catch (error) {
    console.error(`Pollinations ${task} failed`, error);
    throw new ConvexError(
      `The AI ${task} service is busy right now. Please try again in a moment.`
    );
  }
}

async function cloudflareRun(
  creds: { accountId: string; token: string },
  model: string,
  body: unknown
): Promise<Response> {
  const response = await fetchWithTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    throw new Error(`Cloudflare ${model} ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  return response;
}

// ---------- images ----------

export async function generateImage(prompt: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const seed = Math.floor(Math.random() * 1_000_000);
  return withFallback(
    "image",
    async (creds) => {
      const response = await cloudflareRun(creds, CLOUDFLARE_MODELS.image, { prompt, steps: 4, seed });
      const json = (await response.json()) as { result?: { image?: string } };
      if (!json.result?.image) throw new Error("Cloudflare returned no image");
      return { bytes: base64ToBytes(json.result.image), contentType: "image/jpeg" };
    },
    async () => {
      const url =
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
        `?width=1024&height=1024&seed=${seed}&nologo=true&private=true&model=flux`;
      const response = await fetchWithTimeout(url, {}, 120_000);
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.startsWith("image/")) {
        throw new Error(`Pollinations image ${response.status} ${contentType}`);
      }
      return { bytes: new Uint8Array(await response.arrayBuffer()), contentType };
    }
  );
}

// ---------- text ----------

export async function generateText(system: string, user: string, maxTokens = 1024): Promise<string> {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const text = await withFallback(
    "writing",
    async (creds) => {
      const response = await cloudflareRun(creds, CLOUDFLARE_MODELS.text, {
        messages,
        max_tokens: maxTokens,
        temperature: 0.8,
      });
      const json = (await response.json()) as {
        result?: { response?: string; choices?: { message?: { content?: string } }[] };
      };
      const content = json.result?.response ?? json.result?.choices?.[0]?.message?.content;
      if (!content?.trim()) throw new Error("Cloudflare returned no text");
      return content;
    },
    async () => {
      const response = await fetchWithTimeout("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai", messages, private: true }),
      });
      if (!response.ok) throw new Error(`Pollinations text ${response.status}`);
      const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content;
      if (!content?.trim()) throw new Error("Pollinations returned no text");
      return content;
    }
  );
  return text.trim();
}
