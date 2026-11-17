import type { Doc } from "@convex/_generated/dataModel";

/** A podcast document exactly as stored in Convex. Derived from the schema, so it never drifts. */
export type Podcast = Doc<"podcasts">;

/** What the global player needs to play a podcast. */
export interface AudioTrack {
  podcastId: string;
  title: string;
  author: string;
  audioUrl: string;
  imageUrl: string;
}

export const toAudioTrack = (podcast: Podcast): AudioTrack => ({
  podcastId: podcast._id,
  title: podcast.podcastTitle,
  author: podcast.author,
  audioUrl: podcast.audioUrl,
  imageUrl: podcast.imageUrl,
});
