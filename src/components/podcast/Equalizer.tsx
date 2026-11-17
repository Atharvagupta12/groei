import { cn } from "@/lib/utils";

/** Small animated bars that show which podcast is playing. */
export default function Equalizer({ paused, className }: { paused?: boolean; className?: string }) {
  return (
    <span className={cn("flex h-3.5 items-end gap-[2px]", className)} aria-hidden>
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          className={cn(
            "h-full w-[3px] origin-bottom rounded-full bg-violet-400",
            paused ? "scale-y-50" : "animate-equalizer"
          )}
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}
