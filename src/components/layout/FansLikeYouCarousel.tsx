"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";

import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";
import { DotButton, useDotButton } from "./EmblaCarouselDotButton";

type TopPodcasters = FunctionReturnType<typeof api.users.getTopUserByPodcastCount>;

export default function FansLikeYouCarousel({ podcasters }: { podcasters: TopPodcasters }) {
  const slides = podcasters.filter((p) => p.latestPodcast).slice(0, 5);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1 }, [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  ]);

  const onNavButtonClick = useCallback((api: EmblaCarouselType) => {
    api.plugins()?.autoplay?.stop();
  }, []);

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi, onNavButtonClick);

  if (slides.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((podcaster) => (
            <Link
              key={podcaster._id}
              href={`/podcast/${podcaster.latestPodcast!.podcastId}`}
              className="carousel_box"
            >
              <Image
                src={podcaster.latestPodcast!.imageUrl}
                alt=""
                fill
                sizes="250px"
                className="object-cover"
              />
              <div className="glassmorphism-black relative z-10 flex flex-col p-4">
                <h3 className="truncate text-14 font-semibold text-white-1">
                  {podcaster.latestPodcast!.podcastTitle}
                </h3>
                <p className="truncate text-12 text-white-2">{podcaster.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      {scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              selected={index === selectedIndex}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
