"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePaginatedQuery, useQuery } from "convex/react";
import { Loader2, Search, X } from "lucide-react";

import { api } from "@convex/_generated/api";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import { PodcastGrid } from "@/components/podcast/PodcastCard";

const PAGE_SIZE = 12;

function SearchResults({ term }: { term: string }) {
  const results = useQuery(api.podcasts.getPodcastBySearch, { search: term });
  if (results && results.length === 0) {
    return (
      <EmptyState
        title={`No results for "${term}"`}
        description="Try a different keyword, such as a topic, title or creator name."
      />
    );
  }
  return <PodcastGrid podcasts={results} />;
}

type Sort = "latest" | "popular";

function SortTabs({ value, onChange }: { value: Sort; onChange: (sort: Sort) => void }) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Sort podcasts">
      {(
        [
          ["latest", "Latest"],
          ["popular", "Most played"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "rounded-full px-4 py-1.5 text-14 font-semibold transition-colors",
            value === id ? "bg-white-1 text-black-3" : "bg-black-1 text-white-2 hover:bg-black-2 hover:text-white-1"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AllPodcasts({ sort }: { sort: Sort }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.podcasts.listPodcasts,
    { sort },
    { initialNumItems: PAGE_SIZE }
  );

  if (status === "LoadingFirstPage") return <PodcastGrid loading />;
  if (results.length === 0) {
    return (
      <EmptyState
        title="No podcasts yet"
        description="Be the first to publish one!"
        buttonText="Create a podcast"
        buttonLink="/create-podcast"
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PodcastGrid podcasts={results} />
      {status !== "Exhausted" && (
        <Button
          variant="outline"
          onClick={() => loadMore(PAGE_SIZE)}
          disabled={status === "LoadingMore"}
          className="mx-auto w-full max-w-xs border-black-5 bg-transparent font-bold text-white-1 hover:bg-black-2 hover:text-white-1"
        >
          {status === "LoadingMore" ? <Loader2 className="size-4 animate-spin" /> : "Load more"}
        </Button>
      )}
    </div>
  );
}

export default function DiscoverView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTerm = searchParams.get("search") ?? "";
  const sort: Sort = searchParams.get("sort") === "popular" ? "popular" : "latest";

  const setSort = (next: Sort) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "popular") params.set("sort", "popular");
    else params.delete("sort");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const [input, setInput] = useState(urlTerm);
  const debounced = useDebounce(input.trim(), 400);

  // Keep the URL in sync with the debounced input (replace, so typing doesn't fill history).
  useEffect(() => {
    if (debounced === urlTerm) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debounced) params.set("search", debounced);
    else params.delete("search");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Keep the input in sync when the URL changes (back/forward navigation).
  useEffect(() => {
    setInput((current) => (current.trim() === urlTerm ? current : urlTerm));
  }, [urlTerm]);

  return (
    <div className="flex flex-col gap-9">
      <div className="relative mt-6 md:mt-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-1" />
        <Input
          type="search"
          aria-label="Search podcasts"
          className="input-class h-12 pl-12 pr-12 focus-visible:ring-violet-500 focus-visible:ring-offset-0"
          placeholder="Search by title, creator or topic"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {input && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setInput("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-1 hover:text-white-1"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-20 font-bold text-white-1">
            {urlTerm ? (
              <>
                Results for <span className="text-violet-300">&ldquo;{urlTerm}&rdquo;</span>
              </>
            ) : (
              "Discover podcasts"
            )}
          </h1>
          {!urlTerm && <SortTabs value={sort} onChange={setSort} />}
        </div>
        {urlTerm ? <SearchResults term={urlTerm} /> : <AllPodcasts sort={sort} />}
      </section>
    </div>
  );
}
