"use client";
import { useQuery } from "convex/react";
import React from "react";
import { api } from "../../../../convex/_generated/api";
import EmptyState from "@/components/ui/EmptyState";
import LoaderSpinner from "@/components/ui/LoaderSpinner";
import PodcastCard from "@/components/PodcastCard";
import SearchBar from "@/components/ui/SearchBar";

const Discover = ({ searchParams : {search} }: { searchParams : { search: string } }) => {
  const podcastsData = useQuery(api.podcasts.getPodcastBySearch, {search: search || ''});

  return (
    <div className="flex flex-col gap-9">
      <SearchBar />
      <div className="flex flex-col gap-9 ">
        <h1 className="text-20 font-bold text-white-1"> {!search ? 'Discover Trending Podcasts' : 
          'Search results for : '}
          {search && <span className="text-white-2 ">{search}</span> }
          </h1>
        {podcastsData ? (
          <>
            {podcastsData.length > 0 ? (
              <div className="podcast_grid">
                {podcastsData?.map(
                  ({ _id, podcastTitle, podcastDescription, imageUrl}) => (
                    <PodcastCard
                      key={_id}
                      imgUrl={imageUrl!}
                      title={podcastTitle}
                      description={podcastDescription}
                      podcastId={_id}
                    />
                  )
                )}
              </div>
            ) : (
              <EmptyState title="No result found" />
            )}
          </>
        ) : (
          <LoaderSpinner />
        )}
      </div>
    </div>
  );
};

export default Discover;
