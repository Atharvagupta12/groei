import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";

import { api } from "@convex/_generated/api";
import PodcastDetails from "./PodcastDetails";

type Props = { params: { podcastId: string } };

// Server-rendered metadata gives shared links a proper title, description and cover image.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const podcast = await fetchQuery(api.podcasts.getPodcastById, { podcastId: params.podcastId });
    if (!podcast) return { title: "Podcast not found" };
    return {
      title: podcast.podcastTitle,
      description: podcast.podcastDescription.slice(0, 160),
      openGraph: {
        type: "music.song",
        title: podcast.podcastTitle,
        description: podcast.podcastDescription.slice(0, 160),
        images: [{ url: podcast.imageUrl, width: 1024, height: 1024 }],
        audio: [{ url: podcast.audioUrl, type: "audio/mpeg" }],
      },
    };
  } catch {
    return { title: "Podcast" };
  }
}

export default function PodcastPage({ params }: Props) {
  return <PodcastDetails podcastId={params.podcastId} />;
}
