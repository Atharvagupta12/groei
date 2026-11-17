import React, { useCallback, useEffect, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";

import { cn } from "@/lib/utils";

export const useDotButton = (
  emblaApi: EmblaCarouselType | undefined,
  onButtonClick?: (emblaApi: EmblaCarouselType) => void
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
      onButtonClick?.(emblaApi);
    },
    [emblaApi, onButtonClick]
  );

  const onInit = useCallback((api: EmblaCarouselType) => setScrollSnaps(api.scrollSnapList()), []);
  const onSelect = useCallback((api: EmblaCarouselType) => setSelectedIndex(api.selectedScrollSnap()), []);

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
    return () => {
      emblaApi.off("reInit", onInit).off("reInit", onSelect).off("select", onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  return { selectedIndex, scrollSnaps, onDotButtonClick };
};

export const DotButton = ({
  selected,
  ...props
}: { selected: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      "size-2.5 cursor-pointer rounded-full bg-white-3 transition-all duration-500",
      selected && "w-5 bg-white-1"
    )}
    {...props}
  />
);
