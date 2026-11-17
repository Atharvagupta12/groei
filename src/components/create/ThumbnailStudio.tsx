"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useAction, useMutation } from "convex/react";
import { ImagePlus, Lightbulb, Loader2, Sparkles, Upload } from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { LIMITS } from "@convex/lib/voices";
import { cn, getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export interface ThumbnailImage {
  storageId: Id<"_storage">;
  url: string;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

interface ThumbnailStudioProps {
  image: ThumbnailImage | null;
  setImage: (image: ThumbnailImage | null) => void;
  imagePrompt: string;
  setImagePrompt: (prompt: string) => void;
  title: string;
  description: string;
  isWorking: boolean;
  setIsWorking: (value: boolean) => void;
}

export default function ThumbnailStudio({
  image,
  setImage,
  imagePrompt,
  setImagePrompt,
  title,
  description,
  isWorking,
  setIsWorking,
}: ThumbnailStudioProps) {
  const [mode, setMode] = useState<"ai" | "upload">("ai");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateThumbnail = useAction(api.ai.generateThumbnail);
  const suggestPrompt = useAction(api.ai.suggestImagePrompt);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const registerUpload = useMutation(api.files.registerUpload);

  const handleSuggest = async () => {
    setIsSuggesting(true);
    try {
      setImagePrompt(await suggestPrompt({ title, description }));
    } catch (error) {
      toast({ title: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerate = async () => {
    if (imagePrompt.trim().length < 3) {
      toast({ title: "Describe the thumbnail you want first" });
      return;
    }
    setIsWorking(true);
    try {
      setImage(await generateThumbnail({ prompt: imagePrompt }));
      toast({ title: "Thumbnail generated" });
    } catch (error) {
      toast({ title: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsWorking(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: "Please choose a PNG, JPG, WEBP or GIF image", variant: "destructive" });
      return;
    }
    if (file.size > LIMITS.imageUploadMaxBytes) {
      toast({ title: "Images must be smaller than 5 MB", variant: "destructive" });
      return;
    }
    setIsWorking(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error(`Upload failed with ${response.status}`);
      const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
      setImage(await registerUpload({ storageId }));
      setImagePrompt("");
      toast({ title: "Image uploaded" });
    } catch (error) {
      toast({ title: getErrorMessage(error, "Upload failed. Please try again."), variant: "destructive" });
    } finally {
      setIsWorking(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-full max-w-[520px] gap-1 rounded-lg bg-black-1 p-1" role="tablist">
        {(
          [
            ["ai", "Generate with AI", Sparkles],
            ["upload", "Upload an image", Upload],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-14 font-bold transition-colors",
              mode === value ? "bg-black-6 text-white-1" : "text-white-3 hover:text-white-1"
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {mode === "ai" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-2">
            <Label htmlFor="image-prompt" className="text-16 font-bold text-white-1">
              Describe your cover art
            </Label>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting || (!title.trim() && !description.trim())}
              className="flex items-center gap-1.5 text-12 font-semibold text-violet-400 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
              title={!title.trim() && !description.trim() ? "Add a title or description first" : undefined}
            >
              {isSuggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Lightbulb className="size-3.5" />}
              Suggest from title
            </button>
          </div>
          <Textarea
            id="image-prompt"
            className="input-class min-h-[110px] focus-visible:ring-violet-500 focus-visible:ring-offset-0"
            placeholder="e.g. A neon-lit coffee cup floating in space, retro synthwave style"
            rows={4}
            maxLength={LIMITS.imagePromptMax}
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
          />
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isWorking || !imagePrompt.trim()}
            className="h-11 w-fit gap-2 bg-violet-600 px-6 font-bold hover:bg-violet-500"
          >
            {isWorking ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {isWorking ? "Generating…" : image ? "Generate another" : "Generate thumbnail"}
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a thumbnail image"
          className={cn("image_div", isDragging && "border-violet-500 bg-violet-600/10")}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {isWorking ? (
            <div className="flex-center gap-2 text-16 font-medium text-white-1">
              <Loader2 className="size-5 animate-spin" /> Uploading…
            </div>
          ) : (
            <ImagePlus className="size-10 text-white-3" />
          )}
          <div className="flex flex-col items-center gap-1">
            <p className="text-12 font-bold text-orange-1">Click or drag an image here</p>
            <p className="text-12 text-gray-1">PNG, JPG, WEBP or GIF · up to 5 MB · square works best</p>
          </div>
        </div>
      )}

      {image && (
        <div className="relative size-[200px] overflow-hidden rounded-xl ring-1 ring-white/10">
          <Image src={image.url} alt="Thumbnail preview" fill sizes="200px" className="object-cover" />
        </div>
      )}
    </div>
  );
}
