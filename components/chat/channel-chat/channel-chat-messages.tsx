/* eslint-disable */
"use client";

import React, { useEffect, Fragment, useRef } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/hooks/use-api-client";
import { replaceOrInsertMessage, updateMessage, deleteMessage, chatQueryKey } from "@/lib/query/chat-cache";

import { MemberResponse as Member } from "@/types/api/member";
import { ChatWelcome } from "../chat-welcome";
import { ChannelChatItem } from "./channel-chat-item";
import { Loader2, ServerCrash } from "lucide-react";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useSocket } from "@/components/providers/socket-provider";
import { MessageWithMemberWithProfile } from "@/types";
import { markChannelAsRead } from "@/services/channels-service";
import { useChannelSwitchStore } from "@/hooks/use-channel-switch-store";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

interface ChannelChatMessagesProps {
  name: string;
  member: Member;
  chatId: string;
  apiUrl: string;
  socketQuery: { channelId: string; serverId: string };
}

export const ChannelChatMessages = ({
  name,
  member: currentMember,
  chatId,
  apiUrl,
  socketQuery,
}: ChannelChatMessagesProps) => {
  const queryClient = useQueryClient();
  const chatRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const apiClient = useApiClient();
  const hasMarkedRef = useRef<string | null>(null);
  const {
    isSwitchingChannel,
    switchingChannelId,
    finishSwitchingChannel,
  } = useChannelSwitchStore();

  const queryKey = chatQueryKey(chatId);

  useEffect(() => {
    if (!chatId || !socketQuery.serverId) return;

    if (hasMarkedRef.current === chatId) return;
    hasMarkedRef.current = chatId;

    const markAsRead = async () => {
      try {
        await markChannelAsRead(apiClient, chatId, socketQuery.serverId);
      } catch (error) {
        console.error("Failed to mark channel as read:", error);
      }
    };

    markAsRead();
  }, [chatId, socketQuery.serverId]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({
      queryKey,
      apiUrl,
      paramKey: "channelId",
      paramValue: chatId,
    });

  useEffect(() => {
    if (!isSwitchingChannel) return;
    if (switchingChannelId !== chatId) return;
    if (status !== "success" && status !== "error") return;

    const timeout = setTimeout(() => {
      finishSwitchingChannel();
    }, 150);

    return () => clearTimeout(timeout);
  }, [
    chatId,
    isSwitchingChannel,
    switchingChannelId,
    status,
    finishSwitchingChannel,
  ]);

  const createHandler = ({
    message,
    tempId,
  }: {
    message: MessageWithMemberWithProfile;
    tempId?: string;
  }) => {
    replaceOrInsertMessage(queryClient, queryKey, message, tempId)
  }

  const updateHandler = (updatedMessage: MessageWithMemberWithProfile) => {
    updateMessage(queryClient, queryKey, updatedMessage)
  }

  const deleteHandler = ({ id, content }: { id: string; content?: string }) => {
    deleteMessage(queryClient, queryKey, id, content)
  }

  useEffect(() => {
    if (!socket) return;

    socket.emit("channel:join", { channelId: chatId });

    socket.on("channel:message", createHandler);
    socket.on("channel:message:update", updateHandler);
    socket.on("channel:message:delete", deleteHandler);

    const onConnect = () => {
      socket.emit("channel:join", { channelId: chatId });
    };

    socket.on("connect", onConnect);

    return () => {
      socket.emit("channel:leave", { channelId: chatId });

      socket.off("channel:message", createHandler);
      socket.off("channel:message:update", updateHandler);
      socket.off("channel:message:delete", deleteHandler);

      socket.off("connect", onConnect);
    };
  }, [socket, chatId]);

  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
    scrollKey: chatId,
    enabled: status !== "loading" && !isSwitchingChannel,
  });

  if (status === "loading" || isSwitchingChannel)
    return (
      <div className="flex flex-col flex-1 justify-center items-center bg-gradient-to-b from-white dark:from-zinc-900 to-gray-50 dark:to-zinc-950">
        <Loader2 className="h-7 w-7 text-indigo-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">Loading messages...</p>
      </div>
    );

  if (status === "error")
    return (
      <div className="flex flex-col flex-1 justify-center items-center bg-gradient-to-b from-white dark:from-zinc-900 to-gray-50 dark:to-zinc-950">
        <ServerCrash className="h-10 w-10 text-red-500 my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          There was an error while loading!
        </p>
      </div>
    );

  return (
    <div ref={chatRef} className="flex-1 flex flex-col py-4 overflow-y-auto bg-gradient-to-b from-white dark:from-zinc-900 to-gray-50 dark:to-zinc-950">
      <div className="flex-1" />
      {!hasNextPage && <ChatWelcome type="channel" name={name} />}

      <div className="flex justify-center">
        {isFetchingNextPage ? (
          <Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
        ) : (
          hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 text-xs my-4 dark:hover:text-zinc-300 transition"
            >
              Load previous messages
            </button>
          )
        )}
      </div>

      <div className="flex flex-col-reverse mt-auto">
        {data?.pages?.map((group, pageIndex) => (
          <Fragment key={pageIndex}>
            {group.items.map(
              (message: MessageWithMemberWithProfile, itemIndex: number) => (
                <ChannelChatItem
                  key={`${message.id}-${pageIndex}-${itemIndex}`}
                  currentMember={currentMember}
                  member={message.member}
                  id={message.id}
                  content={message.content}
                  fileUrl={message.fileUrl}
                  fileType={message.fileType}
                  deleted={message.deleted}
                  timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                  isUpdated={message.updatedAt !== message.createdAt}
                  status={(message as any).status}
                  socketQuery={socketQuery}
                  isFlagged={message.isFlagged}
                  flagReason={message.flagReason}
                />
              )
            )}
          </Fragment>
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  );
};
