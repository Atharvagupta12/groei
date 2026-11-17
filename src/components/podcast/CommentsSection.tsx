"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Loader2, MessageCircle, Send, Trash2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { LIMITS } from "@convex/lib/voices";
import { cn, getErrorMessage, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

const PAGE_SIZE = 10;

function Avatar({ src, size = 40 }: { src?: string; size?: number }) {
  return (
    <Image
      src={src || "/icons/avatar.svg"}
      alt=""
      width={size}
      height={size}
      className="aspect-square shrink-0 rounded-full bg-black-2 object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function CommentComposer({ podcastId }: { podcastId: Id<"podcasts"> }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const addComment = useMutation(api.comments.addComment);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [focused, setFocused] = useState(false);

  if (!isLoaded) return <Skeleton className="h-20 w-full rounded-xl" />;

  if (!user) {
    return (
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl bg-black-1 p-4 sm:flex-row sm:items-center">
        <p className="text-14 text-white-2">Sign in to join the conversation.</p>
        <Button asChild size="sm" className="rounded-full bg-violet-600 px-5 font-bold hover:bg-violet-500">
          <Link href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`}>Sign in to comment</Link>
        </Button>
      </div>
    );
  }

  const submit = async () => {
    const text = body.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await addComment({ podcastId, body: text });
      setBody("");
      setFocused(false);
    } catch (error) {
      toast({ title: getErrorMessage(error), variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const nearLimit = body.length > LIMITS.commentMax * 0.8;
  const expanded = focused || body.length > 0;

  return (
    <form
      className="flex gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Avatar src={user.imageUrl} />
      <div className="flex flex-1 flex-col gap-2">
        <Textarea
          aria-label="Add a comment"
          placeholder="Share your thoughts about this episode…"
          value={body}
          maxLength={LIMITS.commentMax}
          rows={expanded ? 3 : 1}
          onFocus={() => setFocused(true)}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          className="input-class min-h-0 resize-none transition-all focus-visible:ring-violet-500 focus-visible:ring-offset-0"
        />
        {expanded && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-12 text-white-3">
              {nearLimit ? (
                <span className="tabular-nums text-orange-1">
                  {LIMITS.commentMax - body.length} characters left
                </span>
              ) : (
                <span className="max-sm:hidden">Ctrl + Enter to post</span>
              )}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBody("");
                  setFocused(false);
                }}
                className="rounded-full text-white-2 hover:bg-black-2 hover:text-white-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!body.trim() || posting}
                className="gap-1.5 rounded-full bg-violet-600 px-4 font-bold hover:bg-violet-500"
              >
                {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-3.5" />}
                Post
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

export default function CommentsSection({
  podcastId,
  podcastOwnerId,
  commentCount,
}: {
  podcastId: Id<"podcasts">;
  podcastOwnerId: string;
  commentCount: number;
}) {
  const { user } = useUser();
  const deleteComment = useMutation(api.comments.deleteComment);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { results, status, loadMore } = usePaginatedQuery(
    api.comments.listComments,
    { podcastId },
    { initialNumItems: PAGE_SIZE }
  );

  const handleDelete = async (commentId: Id<"comments">) => {
    setDeleting(commentId);
    try {
      await deleteComment({ commentId });
      toast({ title: "Comment deleted" });
    } catch (error) {
      toast({ title: getErrorMessage(error), variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="mt-12 flex flex-col gap-6" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="flex scroll-mt-20 items-center gap-2 text-18 font-bold text-white-1">
        <MessageCircle className="size-5" /> Comments
        {commentCount > 0 && <span className="text-white-3">({commentCount})</span>}
      </h2>

      <CommentComposer podcastId={podcastId} />

      {status === "LoadingFirstPage" ? (
        <div className="flex flex-col gap-5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="py-4 text-center text-14 text-white-3">
          No comments yet. Be the first to share what you think!
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {results.map((comment) => {
            const isCreator = comment.authorId === podcastOwnerId;
            const canDelete = user && (user.id === comment.authorId || user.id === podcastOwnerId);
            return (
              <li key={comment._id} className="group flex gap-3">
                <Link href={`/profile/${comment.authorId}`} aria-label={comment.authorName}>
                  <Avatar src={comment.authorImageUrl} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={`/profile/${comment.authorId}`}
                      className="text-14 font-bold text-white-1 hover:text-violet-300"
                    >
                      {comment.authorName}
                    </Link>
                    {isCreator && (
                      <span className="rounded bg-violet-600/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
                        Creator
                      </span>
                    )}
                    <span className="text-12 text-white-3">{timeAgo(comment._creationTime)}</span>
                  </div>
                  <p className="whitespace-pre-line break-words text-14 leading-relaxed text-white-2">
                    {comment.body}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment._id)}
                    disabled={deleting === comment._id}
                    aria-label="Delete comment"
                    title="Delete comment"
                    className={cn(
                      "flex-center size-8 shrink-0 rounded-full text-white-3 transition-all hover:bg-black-2 hover:text-red-400 focus-visible:opacity-100",
                      "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    )}
                  >
                    {deleting === comment._id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {status === "CanLoadMore" || status === "LoadingMore" ? (
        <Button
          variant="outline"
          onClick={() => loadMore(PAGE_SIZE)}
          disabled={status === "LoadingMore"}
          className="mx-auto rounded-full border-black-5 bg-transparent px-6 font-bold text-white-1 hover:bg-black-2 hover:text-white-1"
        >
          {status === "LoadingMore" ? <Loader2 className="size-4 animate-spin" /> : "Show more comments"}
        </Button>
      ) : null}
    </section>
  );
}
