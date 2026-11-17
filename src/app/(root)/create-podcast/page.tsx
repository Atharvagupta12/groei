import type { Metadata } from "next";

import CreatePodcastForm from "./CreatePodcastForm";

export const metadata: Metadata = {
  title: "Create a podcast",
  description: "Write or generate a script, choose an AI voice and create cover art.",
};

export default function CreatePodcastPage() {
  return <CreatePodcastForm />;
}
