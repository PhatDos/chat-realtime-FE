"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Search, Sparkles, X } from "lucide-react";

import { useApiClient } from "@/hooks/use-api-client";
import {
  searchChannelMessages,
  searchDirectMessages,
} from "@/services/chat-message-search-service";
import type {
  DirectMessage,
  MessageWithMemberWithProfile,
} from "@/types/api/message";

const DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;

type ChatMessageSearchBarProps =
  | {
      type: "channel";
      channelId: string;
      conversationId?: never;
    }
  | {
      type: "conversation";
      conversationId: string;
      channelId?: never;
    };

type SearchResult = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string | Date;
};

const highlightText = (text: string, query: string) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return text;

  const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const segments = text.split(new RegExp(`(${escaped})`, "ig"));

  return segments.map((segment, index) =>
    segment.toLowerCase() === trimmedQuery.toLowerCase() ? (
      <mark
        key={`${segment}-${index}`}
        className="rounded-md bg-amber-200/80 px-1 text-zinc-950 dark:bg-amber-300/80"
      >
        {segment}
      </mark>
    ) : (
      <span key={`${segment}-${index}`}>{segment}</span>
    ),
  );
};

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const normalizeChannelResults = (
  items: MessageWithMemberWithProfile[],
): SearchResult[] =>
  items.map((message) => ({
    id: message.id,
    content: message.content,
    authorName: message.member?.profile?.name ?? "Former member",
    createdAt: message.createdAt,
  }));

const normalizeDirectResults = (items: DirectMessage[]): SearchResult[] =>
  items.map((message) => ({
    id: message.id,
    content: message.content,
    authorName: message.sender?.name ?? "Unknown user",
    createdAt: message.createdAt,
  }));

export const ChatMessageSearchBar = (props: ChatMessageSearchBarProps) => {
  const api = useApiClient();
  const { type } = props;
  const channelId = props.type === "channel" ? props.channelId : undefined;
  const conversationId =
    props.type === "conversation" ? props.conversationId : undefined;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let active = true;

    const runSearch = async () => {
      const normalizedQuery = debouncedQuery.trim();

      if (normalizedQuery.length < MIN_SEARCH_LENGTH) {
        setResults([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response =
          type === "channel" && channelId
            ? await searchChannelMessages(api, channelId, normalizedQuery)
            : await searchDirectMessages(
                api,
                conversationId ?? "",
                normalizedQuery,
              );

        if (!active) return;

        setResults(
          type === "channel"
            ? normalizeChannelResults(response.items as MessageWithMemberWithProfile[])
            : normalizeDirectResults(response.items as DirectMessage[]),
        );
      } catch {
        if (!active) return;

        setResults([]);
        setError("Unable to search messages.");
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
  }, [api, channelId, conversationId, debouncedQuery, type]);

  const showPanel = isFocused || query.trim().length > 0;
  const hasMinLength = debouncedQuery.length >= MIN_SEARCH_LENGTH;
  const queryLabel = useMemo(() => query.trim(), [query]);

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setError(null);
  };

  const handleOpenResult = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-indigo-400");
      window.setTimeout(() => {
        element.classList.remove("ring-2", "ring-indigo-400");
      }, 1400);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 150);
        }}
        className="h-9 w-full rounded-full border border-zinc-200/80 bg-zinc-50/90 pl-10 pr-14 text-sm font-normal outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-zinc-950/5 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:bg-white/8 dark:focus:ring-white/10"
        placeholder="Search messages"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-7 items-center gap-1 rounded-full border border-zinc-200/80 bg-white/90 px-2 text-[11px] font-medium text-zinc-600 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}

        <div className="pointer-events-none hidden items-center gap-1 rounded-full border border-zinc-200/80 bg-white/90 px-2 py-1 text-[11px] font-medium text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 xl:flex">
          <Sparkles className="h-3.5 w-3.5" />
          Search
        </div>
      </div>

      {showPanel ? (
        <div className="absolute left-1/2 top-[calc(100%+0.75rem)] z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#141418]/95">
          <div className="border-b border-zinc-200/80 px-4 py-3 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                Search messages
              </p>
              <div className="max-w-[12rem] truncate rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                {queryLabel || "Type to search"}
              </div>
            </div>
          </div>

          <div className="max-h-[22rem] overflow-y-auto p-4">
            {!hasMinLength ? (
              <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/70 p-4 text-sm font-normal text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                Type at least {MIN_SEARCH_LENGTH} characters.
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-sm font-normal text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
                {error}
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="h-9 w-9 animate-pulse rounded-2xl bg-zinc-200 dark:bg-white/10" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-3/5 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
                      <div className="h-3 w-4/5 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/70 p-4 text-sm font-normal text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                No messages found for <span className="font-semibold">{queryLabel}</span>.
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleOpenResult(result.id)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/15 dark:hover:bg-white/8"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {highlightText(result.content, queryLabel)}
                      </p>
                      <p className="truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {result.authorName} - {formatDate(result.createdAt)}
                      </p>
                    </div>
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
