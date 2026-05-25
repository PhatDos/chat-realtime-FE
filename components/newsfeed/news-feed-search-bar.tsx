"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MoreHorizontal, Search, Sparkles, X } from "lucide-react";

import { useApiClient } from "@/hooks/use-api-client";
import { searchPosts } from "@/services/posts-client-service";
import type { FeedPost } from "./types";

const DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;

const formatVisibility = (visibility: FeedPost["visibility"]) => {
  if (visibility === "PUBLIC") return "Public";
  if (visibility === "FRIENDS") return "Friends";
  return "Private";
};

const highlightText = (text: string, query: string) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return text;

  const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const segments = text.split(new RegExp(`(${escaped})`, "ig"));

  return segments.map((segment, index) =>
    segment.toLowerCase() === trimmedQuery.toLowerCase() ? (
      <mark key={`${segment}-${index}`} className="rounded-md bg-amber-200/80 px-1 text-zinc-950 dark:bg-amber-300/80">
        {segment}
      </mark>
    ) : (
      <span key={`${segment}-${index}`}>{segment}</span>
    ),
  );
};

export const NewsFeedSearchBar = () => {
  const api = useApiClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FeedPost[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    let isActive = true;

    const runSearch = async () => {
      const normalizedQuery = debouncedQuery.trim();

      if (normalizedQuery.length < MIN_SEARCH_LENGTH) {
        setSearchResults([]);
        setSearchError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setSearchError(null);

      try {
        const response = await searchPosts(api, normalizedQuery, 20);

        if (!isActive) return;

        setSearchResults(response.items ?? []);
      } catch (error) {
        if (!isActive) return;

        setSearchResults([]);
        setSearchError("Unable to load search results. Please try again.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void runSearch();

    return () => {
      isActive = false;
    };
  }, [api, debouncedQuery]);

  const showSearchPanel = isSearchFocused || searchQuery.trim().length > 0;
  const hasMinLength = debouncedQuery.length >= MIN_SEARCH_LENGTH;
  const visibleResults = hasMinLength ? searchResults : [];
  const queryLabel = useMemo(() => searchQuery.trim(), [searchQuery]);

  const handleClear = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSearchResults([]);
    setSearchError(null);
  };

  const handleOpenPost = (postId: string) => {
    router.push(`/newsfeed/posts/${postId}`);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => {
          window.setTimeout(() => setIsSearchFocused(false), 150);
        }}
        className="h-11 w-full rounded-full border border-zinc-200/80 bg-zinc-50/90 pl-11 pr-36 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-zinc-950/5 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:bg-white/8 dark:focus:ring-white/10"
        placeholder="Search in posts..."
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {searchQuery ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-8 items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/90 px-3 text-[11px] font-medium text-zinc-600 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}

        <div className="pointer-events-none flex items-center gap-1 rounded-full border border-zinc-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
          <Sparkles className="h-3.5 w-3.5" />
          Search
        </div>
      </div>

      {showSearchPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#141418]/95">
          <div className="border-b border-zinc-200/80 px-4 py-3 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  Search posts
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Visibility-aware search across public, friends-only, and private posts.
                </p>
              </div>
              <div className="rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                {queryLabel || "Type to search"}
              </div>
            </div>
          </div>

          <div className="p-4">
            {!hasMinLength ? (
              <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/70 p-5 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                Type at least <span className="font-semibold">{MIN_SEARCH_LENGTH}</span> characters to search posts.
              </div>
            ) : searchError ? (
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
                {searchError}
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="h-10 w-10 animate-pulse rounded-2xl bg-zinc-200 dark:bg-white/10" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-3/5 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
                      <div className="h-3 w-4/5 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/70 p-5 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                No posts found for <span className="font-semibold">{queryLabel}</span>.
              </div>
            ) : (
              <div className="space-y-2">
                {visibleResults.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => handleOpenPost(post.id)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/15 dark:hover:bg-white/8"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                      <MoreHorizontal className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {highlightText(post.content, queryLabel)}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {post.author.name} · {formatVisibility(post.visibility)} · {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-zinc-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};