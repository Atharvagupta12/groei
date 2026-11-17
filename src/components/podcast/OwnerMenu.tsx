"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { LIMITS } from "@convex/lib/voices";
import { useAudio } from "@/providers/AudioProvider";
import { getErrorMessage } from "@/lib/utils";
import type { Podcast } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OwnerMenuProps {
  podcast: Podcast;
  onDeleteStart: () => void;
  onDeleteFailed: () => void;
}

export default function OwnerMenu({ podcast, onDeleteStart, onDeleteFailed }: OwnerMenuProps) {
  const router = useRouter();
  const { track, close } = useAudio();
  const updatePodcast = useMutation(api.podcasts.updatePodcast);
  const deletePodcast = useMutation(api.podcasts.deletePodcast);

  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [title, setTitle] = useState(podcast.podcastTitle);
  const [description, setDescription] = useState(podcast.podcastDescription);
  const [busy, setBusy] = useState(false);

  const openEdit = () => {
    setTitle(podcast.podcastTitle);
    setDescription(podcast.podcastDescription);
    setDialog("edit");
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await updatePodcast({
        podcastId: podcast._id,
        podcastTitle: title,
        podcastDescription: description,
      });
      toast({ title: "Podcast updated" });
      setDialog(null);
    } catch (error) {
      toast({ title: getErrorMessage(error), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    onDeleteStart();
    try {
      if (track?.podcastId === podcast._id) close();
      await deletePodcast({ podcastId: podcast._id });
      toast({ title: "Podcast deleted" });
      router.replace(`/profile/${podcast.authorId}`);
    } catch (error) {
      onDeleteFailed();
      toast({ title: getErrorMessage(error), variant: "destructive" });
      setBusy(false);
      setDialog(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Podcast options"
          className="flex-center size-9 shrink-0 rounded-full text-white-2 transition-colors hover:bg-black-2 hover:text-white-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <MoreHorizontal className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openEdit}>
            <Pencil className="size-4" /> Edit details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialog("delete")} className="text-red-400 focus:text-red-300">
            <Trash2 className="size-4" /> Delete podcast
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "edit"} onOpenChange={(open) => !busy && setDialog(open ? "edit" : null)}>
        <DialogContent>
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>Edit podcast</DialogTitle>
              <DialogDescription>Update the title and description listeners see.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                className="input-class"
                value={title}
                maxLength={LIMITS.titleMax}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                className="input-class min-h-[120px]"
                value={description}
                maxLength={LIMITS.descriptionMax}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="bg-violet-600 font-bold hover:bg-violet-500">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(open) => !busy && setDialog(open ? "delete" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this podcast?</DialogTitle>
            <DialogDescription>
              &ldquo;{podcast.podcastTitle}&rdquo;, its audio and its cover art will be permanently deleted.
              This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy} className="font-bold">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
