"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, FileText, ImageIcon, Loader2, ServerCrash, X } from "lucide-react";

import { useSocket } from "@/components/providers/socket-provider";
import { useApiClient } from "@/hooks/use-api-client";
import {
  type ChatAttachment,
  getChannelFiles,
  getChannelMedia,
  getConversationFiles,
  getConversationMedia,
} from "@/services/chat-attachments-service";
import { cn } from "@/lib/utils";

type ChatAttachmentsPanelProps = {
  scope: "channel" | "conversation";
  id: string;
  type: "media" | "files";
};

const getAttachmentUrl = (attachment: ChatAttachment) => attachment.fileUrl ?? "";

const getAttachmentDate = (attachment: ChatAttachment) =>
  new Date(attachment.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getAttachmentAuthor = (attachment: ChatAttachment) => {
  if ("sender" in attachment) return attachment.sender?.name ?? "Unknown user";

  return attachment.member?.profile?.name ?? "Former member";
};

const getMessageFromPayload = (payload: unknown): ChatAttachment | null => {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  if (record.message && typeof record.message === "object") {
    return record.message as ChatAttachment;
  }

  return payload as ChatAttachment;
};

const matchesPanel = (
  attachment: ChatAttachment,
  scope: ChatAttachmentsPanelProps["scope"],
  id: string,
  type: ChatAttachmentsPanelProps["type"],
) => {
  const fileUrl = getAttachmentUrl(attachment);

  if (!fileUrl || attachment.deleted) return false;

  if (scope === "channel") {
    if (!("channelId" in attachment)) return false;
    if (attachment.channelId !== id) return false;
  }

  if (scope === "conversation") {
    if (!("conversationId" in attachment)) return false;
    if (attachment.conversationId !== id) return false;
  }

  return type === "media"
    ? attachment.fileType === "img"
    : attachment.fileType !== "img";
};

const upsertNewest = (items: ChatAttachment[], attachment: ChatAttachment) => {
  const filtered = items.filter((item) => item.id !== attachment.id);

  return [attachment, ...filtered];
};

export const ChatAttachmentsPanel = ({
  scope,
  id,
  type,
}: ChatAttachmentsPanelProps) => {
  const api = useApiClient();
  const { socket } = useSocket();
  const [items, setItems] = useState<ChatAttachment[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAttachments = async () => {
      setStatus("loading");

      try {
        const response =
          scope === "channel"
            ? type === "media"
              ? await getChannelMedia(api, id)
              : await getChannelFiles(api, id)
            : type === "media"
              ? await getConversationMedia(api, id)
              : await getConversationFiles(api, id);

        if (!active) return;

        setItems(response);
        setStatus("success");
      } catch {
        if (!active) return;

        setItems([]);
        setStatus("error");
      }
    };

    void loadAttachments();

    return () => {
      active = false;
    };
  }, [api, id, scope, type]);

  useEffect(() => {
    if (!socket) return;

    const eventName = scope === "channel" ? "channel:message" : "dm:create";

    const handleMessage = (payload: unknown) => {
      const attachment = getMessageFromPayload(payload);

      if (!attachment || !matchesPanel(attachment, scope, id, type)) return;

      setItems((current) => upsertNewest(current, attachment));
    };

    socket.on(eventName, handleMessage);

    return () => {
      socket.off(eventName, handleMessage);
    };
  }, [id, scope, socket, type]);

  const title = type === "media" ? "Media" : "Files";
  const emptyLabel = useMemo(
    () =>
      type === "media"
        ? "No images have been sent here yet."
        : "No files have been sent here yet.",
    [type],
  );

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          Loading {title.toLowerCase()}...
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-950">
        <ServerCrash className="mb-3 h-9 w-9 text-red-500" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Unable to load {title.toLowerCase()}.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 p-5 dark:from-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Shared {title.toLowerCase()}
            </h2>
          </div>
          <div className="rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            {items.length} items
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/70 p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            {emptyLabel}
          </div>
        ) : type === "media" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const url = getAttachmentUrl(item);

              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-white/15"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(url)}
                    className="relative block aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800"
                  >
                    <img src={url} alt="PDF File" className="h-full w-full object-cover transition group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                      <ImageIcon className="h-7 w-7 text-white" />
                    </div>
                  </button>
                  <div className="space-y-2 p-3">
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {getAttachmentAuthor(item)} - {getAttachmentDate(item)}
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={url}
                        download
                        className="flex h-8 flex-1 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                        aria-label="Download image"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 flex-1 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                        aria-label="Open original"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const url = getAttachmentUrl(item);
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 p-3 shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">PDF File</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {getAttachmentAuthor(item)} - {getAttachmentDate(item)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={url}
                      download
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                      aria-label="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                      aria-label="Open file"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-h-full max-w-5xl overflow-hidden rounded-2xl bg-black">
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className={cn(
                "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full",
                "bg-black/60 text-white transition hover:bg-black/80",
              )}
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={previewUrl} alt="Preview" className="max-h-[85vh] max-w-[90vw] object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
};
