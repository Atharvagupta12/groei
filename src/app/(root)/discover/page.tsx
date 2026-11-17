import { Suspense } from "react";
import type { Metadata } from "next";

import DiscoverView from "./DiscoverView";
import { PodcastGrid } from "@/components/podcast/PodcastCard";

export const metadata: Metadata = {
  title: "Discover",
  description: "Search and listen to AI-generated podcasts on Groei.",
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="mt-24"><PodcastGrid loading /></div>}>
      <DiscoverView />
    </Suspense>
  );
}
