"use client";

import {
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useApiClient } from "@/hooks/use-api-client";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useToast } from "@/hooks/use-toast";
import {
  setServerUnreadCount,
  incrementServerUnreadCount,
  incrementServerChannelUnread,
  markServerChannelRead,
  serverUnreadQueryKey,
} from "@/lib/query/server-cache";

import { NavigationAction } from "./navigation-action";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { NavigationItem } from "./navigation-item";
import { ModeToggle } from "../common/mode-toggle";
import { UserButton } from "@clerk/nextjs";
import { ConversationItem } from "./conversation-item";
import { Loader2 } from "lucide-react";
import {
  getServers,
} from "@/services/servers/servers-service";

interface NavigationSidebarProps {
  enableSocketListeners?: boolean;
}

export const NavigationSidebar = ({
  enableSocketListeners = true,
}: NavigationSidebarProps) => {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const params = useParams();
  const apiClient = useApiClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/");
    }
  }, [userId, isLoaded, router]);

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["servers"],
      queryFn: ({ pageParam = 0 }) => {
        const skip = pageParam * 7;
        const limit = 7;
        return getServers(apiClient, skip, limit);
      },
      getNextPageParam: (lastPage) => {
        if (lastPage.skip + lastPage.limit < lastPage.total) {
          return Math.floor(lastPage.skip / 7) + 1;
        }
        return undefined;
      },
      enabled: !!userId,
    });

  const servers = data?.pages.flatMap((p) => p.data) ?? [];

  // Intersection Observer để detect khi scroll đến cuối
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Listen server unread updates
  useEffect(() => {
    if (!socket || !enableSocketListeners) return;

    const handler = ({
      serverId,
      totalUnread,
    }: {
      serverId: string;
      totalUnread: number;
    }) => {
      setServerUnreadCount(queryClient, serverId, totalUnread)
    };

    socket.on("server:unread-update", handler);
    return () => {
      socket.off("server:unread-update", handler);
    };
  }, [socket, queryClient, enableSocketListeners]);

  // Listen (new message)
  useEffect(() => {
    if (!socket || !enableSocketListeners) return;

    const handler = ({ 
      serverId, 
      channelId,
      inc,
      senderName,
      content,
      channelName,
      serverName,
      isNotify
    }: { 
      serverId: string; 
      channelId?: string;
      inc?: number | string;
      senderName?: string;
      content?: string;
      channelName?: string;
      serverName?: string;
      isNotify?: boolean;
    }) => {
      const normalizedInc = Number(inc ?? 1);
      if (!Number.isFinite(normalizedInc) || normalizedInc <= 0) return;

      incrementServerUnreadCount(queryClient, serverId, normalizedInc)

      const isActiveChannel = channelId && channelId === params?.channelId;
      if (channelId && !isActiveChannel) {
        const hasUnreadMap = !!queryClient.getQueryData(serverUnreadQueryKey(serverId));
        if (hasUnreadMap) {
          incrementServerChannelUnread(queryClient, serverId, channelId, normalizedInc);
        }
      }

      // Show toast notification
      if (isNotify && senderName && channelName) {
        toast.server.infoMessageNotification({
          senderName,
          channelName,
          serverName,
          content,
        });
      }
    };

    socket.on("channel:notification", handler);
    return () => {
      socket.off("channel:notification", handler);
    };
  }, [socket, params?.channelId, queryClient, toast, enableSocketListeners]);

  // Keep per-channel unread map in sync from a globally mounted component.
  useEffect(() => {
    if (!socket || !enableSocketListeners) return;

    const handler = ({
      serverId,
      channelId,
    }: {
      serverId?: string;
      channelId: string;
    }) => {
      if (!serverId) return;

      const hasUnreadMap = !!queryClient.getQueryData(serverUnreadQueryKey(serverId));
      if (!hasUnreadMap) return;

      markServerChannelRead(queryClient, serverId, channelId);
    };

    socket.on("channel:mark-read", handler);
    return () => {
      socket.off("channel:mark-read", handler);
    };
  }, [socket, queryClient, enableSocketListeners]);

  if (!isLoaded || !userId) {
    return null;
  }

  return (
    <div
      className="fixed left-0 top-0 h-full w-[72px] text-primary
                dark:bg-[#1b1c2a] bg-[#ffffff] py-3 space-y-4 
                flex flex-col items-center"
    >
      <NavigationAction />
      <Separator className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md mx-auto" />
      <ScrollArea className="flex-1 w-full overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center pt-4">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <>
            <div className="pt-1 mb-3">
              <ConversationItem />
            </div>
            {servers?.map((server) => (
              <div key={server.id} className="pt-1 mb-3">
                <NavigationItem
                  id={server.id}
                  name={server.name}
                  imageUrl={server.imageUrl}
                  unreadCount={server.unreadCount}
                />
              </div>
            ))}
            {/* Load more trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isFetchingNextPage && (
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                )}
              </div>
            )}
          </>
        )}
      </ScrollArea>
      <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <ModeToggle />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-[48px] w-[48px]",
              userButtonPopoverCard: { pointerEvents: "initial" }
            },
          }}
        />
      </div>
    </div>
  );
};
