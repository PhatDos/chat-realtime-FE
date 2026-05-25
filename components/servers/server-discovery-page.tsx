"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Globe, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { useApiClient } from "@/hooks/use-api-client";
import { searchServers } from "@/services/servers/servers-service";
import type { ServerDiscoverySummary } from "@/types/api/server";

const DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;

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

const formatVisibility = (visibility: ServerDiscoverySummary["visibility"]) =>
  visibility === "PUBLIC" ? "Public" : "Private";

export const ServerDiscoveryPage = () => {
  const api = useApiClient();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ServerDiscoverySummary[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let active = true;

    const runSearch = async () => {
      const normalized = debouncedQuery.trim();

      if (normalized.length < MIN_SEARCH_LENGTH) {
        setResults([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await searchServers(api, normalized, 20);

        if (!active) return;

        setResults(response.items ?? []);
      } catch {
        if (!active) return;

        setResults([]);
        setError("Unable to load server search results. Please try again.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void runSearch();

    return () => {
      active = false;
    };
  }, [api, debouncedQuery]);

  const showPanel = isFocused || query.trim().length > 0;
  const queryLabel = useMemo(() => query.trim(), [query]);

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setError(null);
  };

  const handleOpenServer = (inviteCode: string) => {
    router.push(`/invite/${inviteCode}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.10),_transparent_22%),linear-gradient(180deg,_#fafafa_0%,_#f4f4f5_46%,_#e4e4e7_100%)] text-zinc-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_24%),linear-gradient(180deg,_#0a0a0b_0%,_#111113_45%,_#18181b_100%)] dark:text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-[#111113]/75">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-xs font-medium text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            Server discovery
          </div>
          <div className="ml-auto rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-xs font-medium text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            Public servers only
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#1c1c20]/85 sm:p-6">
          <div className="mb-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Discover communities
            </p>
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              Search public servers by name
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Only public servers are discoverable. Private servers stay hidden from search.
            </p>
          </div>

          <div className="relative mx-auto max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setIsFocused(false), 150);
              }}
              className="h-12 w-full rounded-full border border-zinc-200/80 bg-zinc-50/90 pl-11 pr-36 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-zinc-950/5 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:bg-white/8 dark:focus:ring-white/10"
              placeholder="Search servers"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              {query ? (
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
          </div>

          {showPanel ? (
            <div className="mt-5 rounded-[1.5rem] border border-zinc-200/80 bg-white/95 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#141418]/95 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                    Results
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Discover public servers by name and join with one click.
                  </p>
                </div>
                <div className="rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                  {queryLabel || "Type to search"}
                </div>
              </div>

              {query.trim().length < MIN_SEARCH_LENGTH ? (
                <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/70 p-5 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                  Type at least <span className="font-semibold">{MIN_SEARCH_LENGTH}</span> characters to search servers.
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
                  {error}
                </div>
              ) : isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="h-12 w-12 animate-pulse rounded-2xl bg-zinc-200 dark:bg-white/10" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-4 w-2/5 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
                        <div className="h-3 w-3/5 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/70 p-5 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                  No public servers found for <span className="font-semibold">{queryLabel}</span>.
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((server) => (
                    <button
                      key={server.id}
                      type="button"
                      onClick={() => handleOpenServer(server.inviteCode)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/15 dark:hover:bg-white/8"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/20">
                        <Globe className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {highlightText(server.name, queryLabel)}
                          </p>
                          <span className="rounded-full border border-zinc-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                            {formatVisibility(server.visibility)}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {server.memberCount.toLocaleString()} members
                        </p>
                      </div>

                      <div className="flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                        Join
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
};