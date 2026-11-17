import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";

import { api } from "@convex/_generated/api";
import ProfileView from "./ProfileView";

type Props = { params: { profileId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const user = await fetchQuery(api.users.getUserById, { clerkId: params.profileId });
    if (!user) return { title: "Creator not found" };
    return {
      title: `${user.name} · Podcasts`,
      description: `Listen to AI podcasts by ${user.name} on Groei.`,
      openGraph: user.imageUrl ? { images: [{ url: user.imageUrl }] } : undefined,
    };
  } catch {
    return { title: "Creator" };
  }
}

export default function ProfilePage({ params }: Props) {
  return <ProfileView profileId={params.profileId} />;
}
