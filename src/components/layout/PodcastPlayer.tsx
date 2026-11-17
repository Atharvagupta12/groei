"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX, X } from "lucide-react";

import { useAudio, useAudioProgress } from "@/providers/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { cn, formatTime } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex-center rounded-full text-white-2 transition-colors hover:text-white-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
        className
      )}
    >
      {children}
    </button>
  );
}

function SeekBar({ className }: { className?: string }) {
  const { seek } = useAudio();
  const { currentTime, duration } = useAudioProgress();
  return (
    <Slider
      aria-label="Seek"
      value={[duration ? currentTime : 0]}
      max={duration || 1}
      step={1}
      disabled={!duration}
      onValueChange={([value]) => seek(value)}
      className={className}
    />
  );
}

function TimeLabel({ kind }: { kind: "current" | "duration" }) {
  const { currentTime, duration } = useAudioProgress();
  return (
    <span className="w-11 shrink-0 text-center text-12 tabular-nums text-white-3">
      {formatTime(kind === "current" ? currentTime : duration)}
    </span>
  );
}

export default function PodcastPlayer() {
  const {
    track,
    isPlaying,
    isLoading,
    toggle,
    skip,
    close,
    playbackRate,
    setPlaybackRate,
    volume,
    setVolume,
    muted,
    toggleMute,
  } = useAudio();

  // Reserve space at the bottom of the page while the player is visible.
  useEffect(() => {
    document.documentElement.dataset.player = track ? "on" : "off";
    return () => {
      document.documentElement.dataset.player = "off";
    };
  }, [track]);

  if (!track) return null;

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(playbackRate) + 1) % SPEEDS.length] ?? 1;
    setPlaybackRate(next);
  };

  const playPause = (
    <button
      type="button"
      onClick={() => toggle()}
      aria-label={isPlaying ? "Pause" : "Play"}
      className="flex-center size-10 shrink-0 rounded-full bg-white-1 text-black-3 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      {isLoading && isPlaying ? (
        <Loader2 className="size-5 animate-spin" />
      ) : isPlaying ? (
        <Pause className="size-5" fill="currentColor" />
      ) : (
        <Play className="ml-0.5 size-5" fill="currentColor" />
      )}
    </button>
  );

  return (
    <div
      role="region"
      aria-label="Audio player"
      className="glassmorphism-black fixed inset-x-0 bottom-[var(--nav-h)] z-40 h-[var(--player-h)] border-t border-white/5"
    >
      {/* Mobile: thin seek bar on top */}
      <SeekBar className="absolute inset-x-0 -top-1.5 md:hidden" />

      <div className="flex h-full items-center gap-4 px-4 md:px-8">
        {/* Track info */}
        <Link
          href={`/podcast/${track.podcastId}`}
          className="flex min-w-0 flex-1 items-center gap-3 md:max-w-[28%]"
        >
          <Image
            src={track.imageUrl || "/images/player1.png"}
            width={56}
            height={56}
            alt=""
            className="aspect-square size-12 shrink-0 rounded-lg object-cover md:size-14"
          />
          <div className="min-w-0">
            <p className="truncate text-14 font-semibold text-white-1">{track.title}</p>
            <p className="truncate text-12 text-white-2">{track.author}</p>
          </div>
        </Link>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 md:hidden">
          {playPause}
          <IconButton label="Close player" onClick={close} className="size-8">
            <X className="size-5" />
          </IconButton>
        </div>

        {/* Desktop controls */}
        <div className="hidden flex-1 flex-col items-center gap-1 md:flex">
          <div className="flex items-center gap-5">
            <IconButton label="Back 10 seconds" onClick={() => skip(-10)} className="size-8">
              <RotateCcw className="size-5" />
            </IconButton>
            {playPause}
            <IconButton label="Forward 10 seconds" onClick={() => skip(10)} className="size-8">
              <RotateCw className="size-5" />
            </IconButton>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2">
            <TimeLabel kind="current" />
            <SeekBar />
            <TimeLabel kind="duration" />
          </div>
        </div>

        <div className="hidden w-[28%] items-center justify-end gap-4 md:flex">
          <button
            type="button"
            onClick={cycleSpeed}
            aria-label={`Playback speed ${playbackRate}x`}
            className="w-12 rounded-md bg-black-2 py-1 text-12 font-bold tabular-nums text-white-1 transition-colors hover:bg-black-5"
          >
            {playbackRate}x
          </button>
          <div className="flex items-center gap-2">
            <IconButton label={muted ? "Unmute" : "Mute"} onClick={toggleMute} className="size-8">
              {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </IconButton>
            <Slider
              aria-label="Volume"
              value={[muted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={([value]) => setVolume(value / 100)}
              className="w-24 max-lg:hidden"
            />
          </div>
          <IconButton label="Close player" onClick={close} className="size-8">
            <X className="size-5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
