"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { Check, Loader2, Pause, Volume2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { VOICES, type Voice } from "@convex/lib/voices";
import { cn, getErrorMessage } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface VoicePickerProps {
  value: string;
  onChange: (voiceId: string) => void;
  remainingChars?: number;
}

export default function VoicePicker({ value, onChange, remainingChars }: VoicePickerProps) {
  const getPreview = useAction(api.ai.getVoicePreview);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  const togglePreview = async (voice: Voice) => {
    const audio = (audioRef.current ??= new Audio());
    audio.pause();
    if (previewing === voice.id) {
      setPreviewing(null);
      return;
    }
    setLoadingPreview(voice.id);
    try {
      audio.src = await getPreview({ voiceId: voice.id });
      audio.onended = () => setPreviewing(null);
      await audio.play();
      setPreviewing(voice.id);
    } catch (error) {
      toast({ title: getErrorMessage(error, "Couldn't load the voice preview"), variant: "destructive" });
      setPreviewing(null);
    } finally {
      setLoadingPreview(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="AI voice">
        {VOICES.map((voice) => {
          const selected = value === voice.id;
          return (
            <div
              key={voice.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border bg-black-1 p-3 transition-colors",
                selected ? "border-violet-500 bg-violet-600/10" : "border-transparent hover:border-black-5"
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(voice.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "flex-center size-5 shrink-0 rounded-full border",
                    selected ? "border-violet-500 bg-violet-600" : "border-white-3"
                  )}
                >
                  {selected && <Check className="size-3" />}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-14 font-semibold text-white-1">{voice.label}</span>
                    <span className="shrink-0 rounded bg-black-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white-3">
                      {voice.gender} · {voice.accent === "British" ? "UK" : "US"}
                    </span>
                  </span>
                  <span className="block truncate text-12 text-white-3">{voice.style}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => togglePreview(voice)}
                aria-label={previewing === voice.id ? `Stop ${voice.label} preview` : `Preview ${voice.label}`}
                title="Preview voice"
                className="flex-center size-8 shrink-0 rounded-full bg-black-2 text-white-2 transition-colors hover:bg-violet-600 hover:text-white-1"
              >
                {loadingPreview === voice.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : previewing === voice.id ? (
                  <Pause className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
      {remainingChars !== undefined && (
        <p className="text-12 text-white-3">
          {new Intl.NumberFormat("en").format(Math.max(0, remainingChars))} characters of voice
          generation left today
        </p>
      )}
    </div>
  );
}
