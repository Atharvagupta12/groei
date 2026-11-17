"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { AlertTriangle, Loader2, Sparkles, Wand2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { getVoice, LIMITS } from "@convex/lib/voices";
import { cn, getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import type { Id } from "@convex/_generated/dataModel";

export interface GeneratedAudio {
  storageId: Id<"_storage">;
  url: string;
  duration: number;
  /** Script and voice the audio was generated from, used to detect stale audio. */
  script: string;
  voiceId: string;
}

const TONES = ["Conversational", "Educational", "Storytelling", "Energetic", "Calm and reflective", "Humorous"];
const LENGTHS = [
  { id: "short", label: "Short", hint: "~1 min" },
  { id: "medium", label: "Medium", hint: "~2 min" },
  { id: "long", label: "Long", hint: "~4 min" },
] as const;

function AiScriptWriter({ onScript, defaultTopic }: { onScript: (script: string) => void; defaultTopic: string }) {
  const generateScript = useAction(api.ai.generateScript);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [length, setLength] = useState<(typeof LENGTHS)[number]["id"]>("short");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const subject = topic.trim() || defaultTopic.trim();
    if (subject.length < 3) {
      toast({ title: "Tell the AI what the episode is about" });
      return;
    }
    setLoading(true);
    try {
      const script = await generateScript({ topic: subject, tone, length });
      onScript(script);
      toast({ title: "Script ready. Edit it however you like." });
    } catch (error) {
      toast({ title: getErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-violet-600/30 bg-hero-glow p-4">
      <div className="flex items-center gap-2 text-14 font-semibold text-violet-200">
        <Sparkles className="size-4" /> Write the script with AI
      </div>
      <Input
        className="input-class"
        placeholder={defaultTopic ? `Topic (defaults to "${defaultTopic.slice(0, 40)}")` : "e.g. The history of coffee in 3 surprising facts"}
        value={topic}
        maxLength={300}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            run();
          }
        }}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="input-class sm:w-56" aria-label="Tone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TONES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md bg-black-1 p-1" role="radiogroup" aria-label="Length">
          {LENGTHS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={length === l.id}
              onClick={() => setLength(l.id)}
              className={cn(
                "flex-1 rounded px-3 py-1.5 text-12 font-semibold transition-colors",
                length === l.id ? "bg-violet-600 text-white-1" : "text-white-2 hover:text-white-1"
              )}
            >
              {l.label} <span className="font-normal opacity-70">{l.hint}</span>
            </button>
          ))}
        </div>
        <Button type="button" onClick={run} disabled={loading} className="gap-2 bg-violet-600 font-bold hover:bg-violet-500 sm:ml-auto">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {loading ? "Writing…" : "Generate script"}
        </Button>
      </div>
    </div>
  );
}

interface ScriptStudioProps {
  script: string;
  setScript: (script: string) => void;
  voiceId: string;
  audio: GeneratedAudio | null;
  setAudio: (audio: GeneratedAudio | null) => void;
  defaultTopic: string;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  /** False when the voice provider isn't configured on the server. */
  voiceReady?: boolean;
}

export default function ScriptStudio({
  voiceReady = true,
  script,
  setScript,
  voiceId,
  audio,
  setAudio,
  defaultTopic,
  isGenerating,
  setIsGenerating,
}: ScriptStudioProps) {
  const generateAudio = useAction(api.ai.generateAudio);

  const isStale = !!audio && (audio.script !== script.trim() || audio.voiceId !== voiceId);
  const voice = getVoice(voiceId);

  const handleGenerate = async () => {
    const text = script.trim();
    if (!text) {
      toast({ title: "Write or generate a script first" });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateAudio({ voiceId, text });
      setAudio({ ...result, duration: 0, script: text, voiceId });
      toast({ title: "Audio generated", description: "Have a listen below." });
    } catch (error) {
      toast({ title: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <AiScriptWriter onScript={setScript} defaultTopic={defaultTopic} />

      <div className="flex flex-col gap-2.5">
        <div className="flex items-end justify-between">
          <Label htmlFor="script" className="text-16 font-bold text-white-1">
            Podcast script
          </Label>
          <span className={cn("text-12 tabular-nums", script.length > LIMITS.scriptMaxChars ? "text-red-400" : "text-white-3")}>
            {script.length.toLocaleString()} / {LIMITS.scriptMaxChars.toLocaleString()}
          </span>
        </div>
        <Textarea
          id="script"
          className="input-class min-h-[200px] leading-relaxed focus-visible:ring-violet-500 focus-visible:ring-offset-0"
          placeholder="Write what your AI host should say, or generate a script above…"
          value={script}
          maxLength={LIMITS.scriptMaxChars}
          onChange={(e) => setScript(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !script.trim() || !voiceReady}
          title={voiceReady ? undefined : "Voice generation isn't set up yet"}
          className="h-11 gap-2 bg-violet-600 px-6 font-bold hover:bg-violet-500"
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isGenerating ? "Generating audio…" : audio ? "Regenerate audio" : "Generate audio"}
        </Button>
        {voice && <span className="text-12 text-white-3">Voice: {voice.label}</span>}
      </div>

      {audio && (
        <div className="flex flex-col gap-2 rounded-xl bg-black-1 p-4">
          {isStale && (
            <p className="flex items-center gap-2 text-12 text-orange-1">
              <AlertTriangle className="size-4" /> You changed the script or voice. Regenerate to update the audio.
            </p>
          )}
          <audio
            controls
            src={audio.url}
            className="w-full"
            onLoadedMetadata={(e) => {
              const duration = e.currentTarget.duration;
              if (Number.isFinite(duration)) setAudio({ ...audio, duration });
            }}
          />
        </div>
      )}
    </div>
  );
}
