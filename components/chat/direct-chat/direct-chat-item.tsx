"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileResponse as Profile } from "@/types/api/member";
import { ProfileHoverCard } from "../../common/profile-hover-card";
import { ActionTooltip } from "../../common/action-tooltip";
import { Edit, Trash, FileIcon } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useModal } from "@/hooks/use-modal-store";
import { useSocket } from "@/components/providers/socket-provider";
import Image from "next/image";
import { MessageStatus } from "@/types";

const formSchema = z.object({ content: z.string().min(1) });

export const DirectChatItem = ({
  id,
  content,
  sender,
  currentMember,
  timestamp,
  fileUrl,
  fileType,
  deleted,
  isUpdated,
  status = "sent",
  socketQuery,
}: {
  id: string;
  content: string;
  sender: Profile;
  currentMember: Profile;
  timestamp: string;
  fileUrl?: string | null;
  fileType?: string;
  deleted: boolean;
  isUpdated: boolean;
  status?: MessageStatus;
  socketQuery: Record<string, string>;
}) => {
  const { socket } = useSocket();
  const { onOpen } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { content },
  });

  useEffect(() => {
    setLocalContent(content);
    form.reset({ content });
  }, [content, form]);

  const onSubmit = useCallback(
    (values: z.infer<typeof formSchema>) => {
      if (!socket) return;

      setLocalContent(values.content);
      setIsEditing(false);

      socket.emit("dm:update", {
        id,
        content: values.content,
        conversationId: socketQuery.conversationId,
      });
    },
    [socket, id, socketQuery.conversationId],
  );

  useEffect(() => {
    if (!contentRef.current || expanded) return;

    const el = contentRef.current;
    setIsOverflowing(el.scrollHeight > el.clientHeight);
  }, [localContent, expanded]);

  useEffect(() => {
    setExpanded(false);
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEditing) {
        setIsEditing(false);
        form.reset({ content: localContent });
      }
    };

    if (isEditing) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditing, localContent, form]);

  const isOwner = currentMember.id === sender.id;
  const canEditMessage = !deleted && isOwner && !fileUrl && status === "sent";
  const canDeleteMessage = !deleted && isOwner && status === "sent" && !isEditing;
  const isImage = !deleted && fileUrl && fileType === "img";
  const isPDF = !deleted && fileUrl && fileType === "pdf";

  const handleDelete = () => {
    onOpen("deleteMessage", {
      query: {
        messageId: id,
        conversationId: socketQuery.conversationId,
        chatType: "conversation",
      },
    });
  };

  return (
    <div
      id={`message-${id}`}
      className={cn(
        "relative group flex items-center hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 p-3 transition-all duration-200 w-full",
        isOwner && "justify-end",
      )}
    >
      <div
        className={cn(
          "flex gap-x-2 items-start w-full",
          isOwner && "flex-row-reverse",
        )}
      >
        <div className="cursor-pointer hover:drop-shadow-md transition">
          <ProfileHoverCard
            id={sender.id}
            name={sender.name}
            imageUrl={sender.imageUrl}
            currentProfileId={currentMember.id}
          />
        </div>

        <div className={cn("flex flex-col w-full", isOwner && "items-end text-right")}>
          <div
            className={cn(
              "flex items-center gap-x-2",
              isOwner && "flex-row-reverse",
            )}
          >
            <p className="font-semibold text-sm hover:underline cursor-pointer">
              {isOwner ? "You" : sender.name}
            </p>

            {status === "sending" && (
              <span className="text-xs opacity-50 animate-pulse flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                Sending…
              </span>
            )}

            {status === "sent" && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                {timestamp}
              </span>
            )}

            {canDeleteMessage && (
              <div
                className={cn(
                  "hidden group-hover:flex absolute top-1/2 -translate-y-1/2 items-center gap-x-2 p-2 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg shadow-lg",
                  !isOwner ? "right-[3%]" : "left-[3%]",
                )}
              >
                <ActionTooltip label="Delete">
                  <Trash
                    onClick={handleDelete}
                    className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors hover:scale-110 duration-200"
                  />
                </ActionTooltip>
                {canEditMessage && (
                  <ActionTooltip label="Edit">
                    <Edit
                      onClick={() => setIsEditing(true)}
                      className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors hover:scale-110 duration-200"
                    />
                  </ActionTooltip>
                )}
              </div>
            )}
          </div>

          {isImage && (
            <a
              href={fileUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-lg mt-2 overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 flex items-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 h-48 w-48 hover:shadow-lg hover:scale-105 transition-all duration-300 group/image"
            >
              <Image
                src={fileUrl!}
                alt={localContent}
                fill
                sizes="192px"
                className="object-cover group-hover/image:brightness-110 transition-all duration-300"
              />
            </a>
          )}

          {isPDF && (
            <div className="relative flex items-center p-3 mt-2 rounded-lg bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-950/50 dark:to-purple-950/50 border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition-all duration-300 hover:scale-105 group/pdf">
              <FileIcon className="h-10 w-10 fill-indigo-300 stroke-indigo-500 dark:fill-indigo-700 dark:stroke-indigo-400 group-hover/pdf:scale-110 transition-transform" />
              <a
                href={fileUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline font-medium transition-colors"
              >
                PDF file
              </a>
            </div>
          )}

          {!fileUrl && !isEditing && (
            <p
                ref={contentRef}
                className={cn(
                  "text-sm text-zinc-700 dark:text-zinc-200 break-words mr-1 leading-relaxed",
                  isOwner ? "ml-24" : "mr-24",
                  !expanded && "line-clamp-2",
                  deleted &&
                    "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1",
                )}
              >
                {localContent}
                {!deleted && isUpdated && status === "sent" && !isEditing && (
                  <span className="text-[10px] mx-2 text-indigo-600 dark:text-indigo-400 font-medium">
                    (edited)
                  </span>
                )}
              </p>
          )}

          {!fileUrl && !isEditing && (isOverflowing || expanded) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline mt-2 w-fit font-medium transition-colors"
            >
              {expanded ? "← Show less" : "Show more →"}
            </button>
          )}

          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                className="flex items-center w-full gap-x-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          {...field}
                          disabled={form.formState.isSubmitting}
                          placeholder="Edited"
                          className="p-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 border border-indigo-300 dark:border-indigo-700 focus-visible:ring-indigo-500 text-zinc-800 dark:text-zinc-100 rounded-md transition-all duration-200"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  size="sm"
                  variant="default"
                  disabled={form.formState.isSubmitting}
                  className="bg-gradient-to-r text-white from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  save
                </Button>
              </form>
              <span className="text-[10px] mt-1 text-zinc-400">
                press esc to cancel, enter to save
              </span>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};
