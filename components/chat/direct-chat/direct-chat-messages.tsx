/* eslint-disable */
"use client";

import React, { useEffect, Fragment } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { replaceOrInsertMessage, updateMessage, deleteMessage, chatQueryKey } from "@/lib/query/chat-cache";

import { ProfileResponse as Profile } from "@/types/api/member";
import { ChatWelcome } from "../chat-welcome";
import { DirectChatItem } from "./direct-chat-item";
import { Loader2, ServerCrash } from "lucide-react";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useSocket } from "@/components/providers/socket-provider";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

type DirectMessageWithSender = {
  id: string;
  content: string;
  fileUrl: string | null;
  fileType?: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  sender: Profile;
  status?: "sending" | "sent";
  tempId?: string;
};

interface DirectChatMessagesProps {
  name: string;
  profile: Profile;
  chatId: string;
  apiUrl: string;
  socketQuery: { conversationId: string; memberId: string };
}

export const DirectChatMessages = ({
  name,
  profile,
  chatId,
  apiUrl,
  socketQuery,
}: DirectChatMessagesProps) => {
  const queryClient = useQueryClient();
  const chatRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  const queryKey = chatQueryKey(chatId);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({
      queryKey,
      apiUrl,
      paramKey: "conversationId",
      paramValue: chatId,
    });

  const createHandler = (
    payload: DirectMessageWithSender & { tempId?: string }
  ) => {
    const { tempId, ...message } = payload
    replaceOrInsertMessage(queryClient, queryKey, message, tempId)
  }

  const updateHandler = (updatedMessage: DirectMessageWithSender) => {
    updateMessage(queryClient, queryKey, updatedMessage)
  }

  const deleteHandler = ({ id, content }: { id: string; content?: string }) => {
    deleteMessage(queryClient, queryKey, id, content)
  }

  useEffect(() => {
    if (!socket) return;

    socket.emit("conversation:join", { conversationId: chatId });

    socket.on("dm:create", createHandler);
    socket.on("dm:update", updateHandler);
    socket.on("dm:delete", deleteHandler);

    const onConnect = () => {
      socket.emit("conversation:join", { conversationId: chatId });
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("dm:create", createHandler);
      socket.off("dm:update", updateHandler);
      socket.off("dm:delete", deleteHandler);

      socket.off("connect", onConnect);
    };
  }, [socket, queryKey]);

  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
    scrollKey: chatId,
    enabled: status !== "loading",
  });

  if (status === "loading")
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
      {!hasNextPage && <ChatWelcome type="conversation" name={name} />}

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
              (message: DirectMessageWithSender, itemIndex: number) => (
                <DirectChatItem
                  key={`${message.id}-${pageIndex}-${itemIndex}`}
                  currentMember={profile}
                  sender={message.sender}
                  id={message.id}
                  content={message.content}
                  fileUrl={message.fileUrl}
                  fileType={message.fileType}
                  deleted={message.deleted}
                  timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                  isUpdated={message.updatedAt !== message.createdAt}
                  status={(message as any).status}
                  socketQuery={socketQuery}
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
