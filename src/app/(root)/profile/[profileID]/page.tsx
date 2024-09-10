"use client";

import { useQuery } from "convex/react";
import EmptyState from "@/components/ui/EmptyState";
import LoaderSpinner from "@/components/ui/LoaderSpinner";
import PodcastCard from "@/components/PodcastCard";
import ProfileCard from "@/components/ui/ProfileCard";
import { api } from "../../../../../convex/_generated/api";

const ProfilePage = ({
  params: {profileId} }: {
  params: {
    profileId: string;
  }
}) => {
  // const user = useQuery(api.users.getUserById, {
  //   clerkId: profileId,
  // });
  // const podcastsData = useQuery(api.podcasts.getPodcastByAuthorId, {
  //   authorId:profileId,
  // });

  // if (!user || !podcastsData) return <LoaderSpinner />;

  return (
<h1 className="flex justify-center text-white-1 mt-10" >
  User is not available now ,will fix it soon</h1>

    // <section className="mt-9 flex flex-col">
    //   <h1 className="text-20 font-bold text-white-1 max-md:text-center">
    //     Groei Profile
    //   </h1>
    //   <div className="mt-6 flex flex-col gap-6 max-md:items-center md:flex-row">
    //     <ProfileCard
    //       podcastData={podcastsData!}
    //       imageUrl={user?.imageUrl!}
    //       userFirstName={user?.name!}
    //     />
    //   </div>
    //   <section className="mt-9 flex flex-col gap-5">
    //     <h1 className="text-20 font-bold text-white-1">All Podcasts</h1>
    //     {podcastsData && podcastsData.podcasts.length > 0 ? (
    //       <div className="podcast_grid">
    //         {podcastsData?.podcasts
    //           ?.slice(0, 4)
    //           .map((podcast) => (
    //             <PodcastCard
    //               key={podcast._id}
    //               imgUrl={podcast.imageUrl!}
    //               title={podcast.podcastTitle!}
    //               description={podcast.podcastDescription}
    //               podcastId={podcast._id}
    //             />
    //           ))}
    //       </div>
    //     ) : (
    //       <EmptyState
    //         title="You have not created any podcasts yet"
    //         buttonLink="/create-podcast"
    //         buttonText="Create Podcast"
    //       />
    //     )}
    //   </section>
    // </section>
  );
};

export default ProfilePage;
