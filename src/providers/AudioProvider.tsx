"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation } from "convex/react";

import { api } from "@convex/_generated/api";
import { toast } from "@/components/ui/use-toast";
import type { AudioTrack } from "@/types";

interface PlayerControls {
  track: AudioTrack | undefined;
  isPlaying: boolean;
  isLoading: boolean;
  playbackRate: number;
  volume: number;
  muted: boolean;
  /** Plays the track, or toggles play/pause if it is already the current track. */
  toggle: (track?: AudioTrack) => void;
  play: (track: AudioTrack) => void;
  pause: () => void;
  close: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

interface PlayerProgress {
  currentTime: number;
  duration: number;
}

const ControlsContext = createContext<PlayerControls | null>(null);
const ProgressContext = createContext<PlayerProgress>({ currentTime: 0, duration: 0 });

const VIEWED_KEY = "groei:viewed";
const PREFS_KEY = "groei:player";

function readPrefs(): { volume?: number; playbackRate?: number } {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writePrefs(prefs: { volume: number; playbackRate: number }) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable - preferences are optional */
  }
}

/** Returns true the first time a podcast is played in this browser session. */
function markViewed(podcastId: string) {
  try {
    const viewed: string[] = JSON.parse(sessionStorage.getItem(VIEWED_KEY) ?? "[]");
    if (viewed.includes(podcastId)) return false;
    sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...viewed, podcastId]));
    return true;
  } catch {
    return true;
  }
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName) ||
    target.getAttribute("role") === "slider");

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<AudioTrack>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const countView = useMutation(api.podcasts.updatePodcastViews);

  // Restore preferences on mount.
  useEffect(() => {
    const prefs = readPrefs();
    if (typeof prefs.volume === "number") setVolumeState(prefs.volume);
    if (typeof prefs.playbackRate === "number") setPlaybackRateState(prefs.playbackRate);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
    audio.playbackRate = playbackRate;
    writePrefs({ volume, playbackRate });
  }, [volume, muted, playbackRate]);

  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch((error: DOMException) => {
      // AbortError happens when a new source interrupts loading. It is harmless.
      if (error.name !== "AbortError") setIsPlaying(false);
    });
  }, []);

  const play = useCallback(
    (next: AudioTrack) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (track?.podcastId === next.podcastId && track.audioUrl === next.audioUrl) {
        startPlayback();
        return;
      }
      setTrack(next);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true);
      audio.src = next.audioUrl;
      audio.playbackRate = playbackRate;
      startPlayback();
      if (markViewed(next.podcastId)) {
        countView({ podcastId: next.podcastId }).catch(() => undefined);
      }
    },
    [track, playbackRate, startPlayback, countView]
  );

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const toggle = useCallback(
    (next?: AudioTrack) => {
      if (next && next.podcastId !== track?.podcastId) return play(next);
      if (audioRef.current?.paused) startPlayback();
      else pause();
    },
    [track, play, pause, startPlayback]
  );

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setTrack(undefined);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(Math.max(0, time), audio.duration);
    setCurrentTime(audio.currentTime);
  }, []);

  const skip = useCallback(
    (seconds: number) => seek((audioRef.current?.currentTime ?? 0) + seconds),
    [seek]
  );

  const setPlaybackRate = useCallback((rate: number) => setPlaybackRateState(rate), []);
  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    setMuted(value === 0);
  }, []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  // OS-level media controls (lock screen, headset buttons, media keys).
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.author,
      album: "Groei",
      artwork: track.imageUrl ? [{ src: track.imageUrl, sizes: "512x512" }] : [],
    });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => startPlayback()],
      ["pause", () => pause()],
      ["seekbackward", () => skip(-10)],
      ["seekforward", () => skip(10)],
    ];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* action not supported */
      }
    }
  }, [track, startPlayback, pause, skip]);

  // The space bar toggles playback when focus is not in a form field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!track || event.code !== "Space" || isTypingTarget(event.target)) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [track, toggle]);

  const controls = useMemo<PlayerControls>(
    () => ({
      track,
      isPlaying,
      isLoading,
      playbackRate,
      volume,
      muted,
      toggle,
      play,
      pause,
      close,
      seek,
      skip,
      setPlaybackRate,
      setVolume,
      toggleMute,
    }),
    [track, isPlaying, isLoading, playbackRate, volume, muted, toggle, play, pause, close, seek, skip, setPlaybackRate, setVolume, toggleMute]
  );

  const progress = useMemo(() => ({ currentTime, duration }), [currentTime, duration]);

  return (
    <ControlsContext.Provider value={controls}>
      <ProgressContext.Provider value={progress}>
        {children}
        <audio
          ref={audioRef}
          preload="metadata"
          className="hidden"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d)) setDuration(d);
          }}
          onDurationChange={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d)) setDuration(d);
          }}
          onError={() => {
            if (!audioRef.current?.getAttribute("src")) return;
            setIsPlaying(false);
            setIsLoading(false);
            toast({ title: "Couldn't play this podcast", variant: "destructive" });
          }}
        />
      </ProgressContext.Provider>
    </ControlsContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(ControlsContext);
  if (!context) throw new Error("useAudio must be used within an AudioProvider");
  return context;
}

export function useAudioProgress() {
  return useContext(ProgressContext);
}
