"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, CheckCircle2, Circle, Loader2, Rocket } from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { DEFAULT_VOICE_ID, LIMITS } from "@convex/lib/voices";
import { cn, getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import VoicePicker from "@/components/create/VoicePicker";
import ScriptStudio, { type GeneratedAudio } from "@/components/create/ScriptStudio";
import ThumbnailStudio, { type ThumbnailImage } from "@/components/create/ThumbnailStudio";

const formSchema = z.object({
  podcastTitle: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(LIMITS.titleMax, `Title must be at most ${LIMITS.titleMax} characters`),
  podcastDescription: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(LIMITS.descriptionMax, `Description must be at most ${LIMITS.descriptionMax} characters`),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * State for a generated or uploaded file. When the file is replaced, the old one
 * is deleted from storage so unused files don't pile up.
 */
function useReplaceableFile<T extends { storageId: Id<"_storage"> }>(
  discard: (args: { storageId: Id<"_storage"> }) => Promise<unknown>
) {
  const [value, setValue] = useState<T | null>(null);
  const current = useRef<T | null>(null);
  const set = useCallback(
    (next: T | null) => {
      const prev = current.current;
      if (prev && prev.storageId !== next?.storageId) {
        discard({ storageId: prev.storageId }).catch(() => undefined);
      }
      current.current = next;
      setValue(next);
    },
    [discard]
  );
  return [value, set] as const;
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-b border-black-5 py-10 first:pt-0">
      <h2 className="flex items-center gap-3 text-18 font-bold text-white-1">
        <span className="flex-center size-7 rounded-full bg-violet-600 text-14">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function CreatePodcastForm() {
  const router = useRouter();
  const createPodcast = useMutation(api.podcasts.createPodcast);
  const discardFile = useMutation(api.files.discardFile);
  const usage = useQuery(api.usage.getMyUsage);
  const aiStatus = useQuery(api.ai.getAiStatus);

  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [script, setScript] = useState("");
  const [audio, setAudio] = useReplaceableFile<GeneratedAudio>(discardFile);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const [image, setImage] = useReplaceableFile<ThumbnailImage>(discardFile);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isWorkingOnImage, setIsWorkingOnImage] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [published, setPublished] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { podcastTitle: "", podcastDescription: "" },
  });
  const title = form.watch("podcastTitle");
  const description = form.watch("podcastDescription");

  // Warn before leaving with unpublished generated content.
  const hasWork = !!audio || !!image || script.trim().length > 0;
  useEffect(() => {
    if (!hasWork || published) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasWork, published]);

  const audioIsStale = !!audio && (audio.script !== script.trim() || audio.voiceId !== voiceId);
  const checklist = [
    { label: "Title and description", done: formSchema.safeParse({ podcastTitle: title, podcastDescription: description }).success },
    { label: "Audio generated", done: !!audio && !audioIsStale },
    { label: "Thumbnail ready", done: !!image },
  ];
  const busy = isSubmitting || isGeneratingAudio || isWorkingOnImage;

  const onSubmit = async (values: FormValues) => {
    if (!audio) {
      toast({ title: "Generate the audio first", variant: "destructive" });
      return;
    }
    if (audioIsStale) {
      toast({ title: "Your script changed. Regenerate the audio before publishing.", variant: "destructive" });
      return;
    }
    if (!image) {
      toast({ title: "Add a thumbnail first", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const podcastId = await createPodcast({
        podcastTitle: values.podcastTitle,
        podcastDescription: values.podcastDescription,
        voiceType: audio.voiceId,
        voicePrompt: audio.script,
        imagePrompt: imagePrompt.trim() || undefined,
        audioStorageId: audio.storageId,
        imageStorageId: image.storageId,
        audioDuration: audio.duration,
      });
      setPublished(true);
      toast({ title: "Podcast published! 🎉" });
      router.push(`/podcast/${podcastId}`);
    } catch (error) {
      toast({ title: getErrorMessage(error), variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const remainingVoiceChars = usage ? usage.voiceChars.limit - usage.voiceChars.used : undefined;

  return (
    <section className="mt-10 flex flex-col">
      {aiStatus && !aiStatus.voice && (
        <div role="alert" className="mb-8 flex gap-3 rounded-xl border border-orange-1/40 bg-orange-1/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange-1" />
          <div className="flex flex-col gap-1 text-14">
            <p className="font-bold text-white-1">Voice generation isn&apos;t set up yet</p>
            <p className="text-white-2">
              The site owner needs to add a free Deepgram API key (
              <code className="rounded bg-black-2 px-1">DEEPGRAM_API_KEY</code>) to the Convex
              environment. Scripts and thumbnails already work.
            </p>
          </div>
        </div>
      )}
      <header className="mb-10 flex flex-col gap-2">
        <h1 className="text-24 font-extrabold text-white-1">Create a podcast</h1>
        <p className="text-14 text-white-2">
          Four quick steps. AI can help with each one.
          {usage && (
            <span className="text-white-3">
              {" "}
              · {usage.images.limit - usage.images.used} AI thumbnails and{" "}
              {usage.scripts.limit - usage.scripts.used} AI writes left today
            </span>
          )}
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col" noValidate>
          <Step number={1} title="Details">
            <FormField
              control={form.control}
              name="podcastTitle"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel className="text-16 font-bold text-white-1">Title</FormLabel>
                  <FormControl>
                    <Input
                      className="input-class focus-visible:ring-violet-500 focus-visible:ring-offset-0"
                      placeholder="e.g. The Curious History of Coffee"
                      maxLength={LIMITS.titleMax}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="podcastDescription"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <div className="flex items-end justify-between">
                    <FormLabel className="text-16 font-bold text-white-1">Description</FormLabel>
                    <span className="text-12 tabular-nums text-white-3">
                      {field.value.length} / {LIMITS.descriptionMax}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      className="input-class min-h-[100px] focus-visible:ring-violet-500 focus-visible:ring-offset-0"
                      placeholder="What will listeners learn or enjoy?"
                      maxLength={LIMITS.descriptionMax}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </Step>

          <Step number={2} title="Choose a voice">
            <VoicePicker value={voiceId} onChange={setVoiceId} remainingChars={remainingVoiceChars} />
          </Step>

          <Step number={3} title="Script and audio">
            <ScriptStudio
              script={script}
              setScript={setScript}
              voiceId={voiceId}
              audio={audio}
              setAudio={setAudio}
              defaultTopic={title || description}
              isGenerating={isGeneratingAudio}
              setIsGenerating={setIsGeneratingAudio}
              voiceReady={aiStatus?.voice ?? true}
            />
          </Step>

          <Step number={4} title="Thumbnail">
            <ThumbnailStudio
              image={image}
              setImage={setImage}
              imagePrompt={imagePrompt}
              setImagePrompt={setImagePrompt}
              title={title}
              description={description}
              isWorking={isWorkingOnImage}
              setIsWorking={setIsWorkingOnImage}
            />
          </Step>

          <div className="flex flex-col gap-5 pt-10">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className={cn("flex items-center gap-2 text-14", item.done ? "text-white-1" : "text-white-3")}
                >
                  {item.done ? (
                    <CheckCircle2 className="size-4 text-green-400" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
            <Button
              type="submit"
              disabled={busy}
              className="h-14 w-full gap-2 rounded-lg bg-violet-600 text-16 font-extrabold hover:bg-violet-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> Publishing…
                </>
              ) : (
                <>
                  <Rocket className="size-5" /> Publish podcast
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
