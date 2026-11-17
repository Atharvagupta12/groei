// Small helpers shared by the AI provider clients.

/** fetch with a timeout, so a hung provider can't stall an action until it times out. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 90_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function concatBytes(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Splits text into chunks of at most maxChars, preferring paragraph and sentence boundaries. */
export function chunkText(text: string, maxChars: number): string[] {
  const sentences =
    text
      .replace(/[ \t]+/g, " ")
      .trim()
      .match(/[^.!?\n]+[.!?]*["')\]]*\s*|\n+/g) ?? [text];

  const chunks: string[] = [];
  let current = "";
  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChars) flush();
    if (sentence.length <= maxChars) {
      current += sentence;
      continue;
    }
    // A single very long "sentence": split it on word boundaries.
    for (const word of sentence.split(/\s+/)) {
      if (current.length + word.length + 1 > maxChars) flush();
      current += (current ? " " : "") + word;
    }
  }
  flush();
  return chunks;
}
