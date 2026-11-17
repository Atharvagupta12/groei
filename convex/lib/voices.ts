// Voice catalog shared by the Convex backend and the Next.js frontend.
// Voices are Deepgram Aura-2 models: https://developers.deepgram.com/docs/tts-models

export interface Voice {
  /** Stored on each podcast as `voiceType`. */
  id: string;
  /** Deepgram model name. */
  model: string;
  label: string;
  gender: "Female" | "Male";
  accent: "American" | "British";
  style: string;
}

export const VOICES: Voice[] = [
  { id: "thalia", model: "aura-2-thalia-en", label: "Thalia", gender: "Female", accent: "American", style: "Clear and energetic" },
  { id: "andromeda", model: "aura-2-andromeda-en", label: "Andromeda", gender: "Female", accent: "American", style: "Casual and expressive" },
  { id: "pandora", model: "aura-2-pandora-en", label: "Pandora", gender: "Female", accent: "British", style: "Smooth and calm" },
  { id: "apollo", model: "aura-2-apollo-en", label: "Apollo", gender: "Male", accent: "American", style: "Confident and casual" },
  { id: "arcas", model: "aura-2-arcas-en", label: "Arcas", gender: "Male", accent: "American", style: "Natural and smooth" },
  { id: "draco", model: "aura-2-draco-en", label: "Draco", gender: "Male", accent: "British", style: "Warm baritone" },
];

export const DEFAULT_VOICE_ID = "thalia";

export const getVoice = (id: string): Voice | undefined =>
  VOICES.find((voice) => voice.id === id);

/** Display name for a stored voiceType. */
export const voiceLabel = (id: string): string => getVoice(id)?.label ?? id;

// Limits shared by the client (for UX hints) and the server (enforcement).
export const LIMITS = {
  scriptMaxChars: 5000,
  titleMax: 80,
  descriptionMax: 600,
  imagePromptMax: 1000,
  commentMax: 1000,
  imageUploadMaxBytes: 5 * 1024 * 1024,
  /** Per-user daily quotas (UTC day). They protect the shared free AI credit. */
  daily: {
    voiceChars: 20000,
    images: 15,
    scripts: 30,
  },
} as const;
