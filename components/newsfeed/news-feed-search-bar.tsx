"use client";

import { useState } from "react";
import { ArrowUpRight, Hash, Home, MoreHorizontal, Search, Sparkles, Users } from "lucide-react";

const searchSuggestions = {
  servers: [
    { id: "design-hub", name: "Design Hub", meta: "12 channels · 84 members" },
    { id: "study-room", name: "Study Room", meta: "8 channels · 41 members" },
  ],
  posts: [
    { id: "post-1", title: "Weekly project update", meta: "in Design Hub · 3h ago" },
    { id: "post-2", title: "Flashcards for Chapter 4", meta: "in Study Room · 6h ago" },
  ],
};

export const NewsFeedSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const showSearchPanel = isSearchFocused || searchQuery.trim().length > 0;

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
        className="h-11 w-full rounded-full border border-zinc-200/80 bg-zinc-50/90 pl-11 pr-28 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-zinc-950/5 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:bg-white/8 dark:focus:ring-white/10"
        placeholder="Search servers or posts"
      />
      <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-zinc-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
        <Sparkles className="h-3.5 w-3.5" />
        Search
      </div>

      {showSearchPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#141418]/95">
          <div className="border-b border-zinc-200/80 px-4 py-3 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  Search preview
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Showing UI-only suggestions for <span className="font-semibold">servers</span> and <span className="font-semibold">posts</span>
                </p>
              </div>
              <div className="rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                {searchQuery.trim() || "Type to search"}
              </div>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-zinc-200/80 p-4 md:border-b-0 md:border-r dark:border-white/10">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                <Users className="h-4 w-4" />
                Servers
              </div>
              <div className="space-y-2">
                {searchSuggestions.servers.map((server) => (
                  <button
                    key={server.id}
                    className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/80 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/15 dark:hover:bg-white/8"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {server.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {server.meta}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                <Home className="h-4 w-4" />
                Posts
              </div>
              <div className="space-y-2">
                {searchSuggestions.posts.map((post) => (
                  <button
                    key={post.id}
                    className="flex w-full items-start gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 text-left transition hover:border-pink-200 hover:bg-pink-50/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/15 dark:hover:bg-white/8"
                  >
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/20">
                      <MoreHorizontal className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {post.title}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {post.meta}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};