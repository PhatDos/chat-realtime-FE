"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/common/user-avatar";
import { Check, X } from "lucide-react";
import { useApiClient } from "@/hooks/use-api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FriendRequestDto } from "@/types/api/friendship";
import {
  getIncomingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
} from "@/services/friends-client-service";

interface NotificationPopoverContentProps {
  onClose?: () => void;
}

export const NotificationPopoverContent = ({ onClose }: NotificationPopoverContentProps) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const incomingQuery = useQuery<FriendRequestDto[]>(["friend-requests", "incoming"], async () => {
    return getIncomingFriendRequests(api);
  });

  const sentQuery = useQuery<FriendRequestDto[]>(["friend-requests", "sent"], async () => {
    return getSentFriendRequests(api);
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => acceptFriendRequest(api, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] });
      await queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] });
      await queryClient.invalidateQueries({ queryKey: ["friend-status"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => rejectFriendRequest(api, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] });
      await queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => cancelFriendRequest(api, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] });
    },
  });

  const incomingRequests = incomingQuery.data || [];
  const sentRequests = sentQuery.data || [];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-96 bg-white dark:bg-zinc-900 rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">Notifications</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Friend requests and updates</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incoming" className="flex-1 flex flex-col border-t border-zinc-200 dark:border-zinc-700">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
          <TabsTrigger value="incoming" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-zinc-700 dark:text-zinc-300">
            Incoming
            {incomingRequests.length > 0 && (
              <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{incomingRequests.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-zinc-700 dark:text-zinc-300">
            Sent
            {sentRequests.length > 0 && (
              <span className="ml-1 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{sentRequests.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Incoming Requests Tab */}
        <TabsContent value="incoming" className="flex-1 flex flex-col m-0">
          {incomingRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="text-zinc-600 dark:text-zinc-400">
                <p className="text-sm font-medium">No incoming requests</p>
                <p className="text-xs mt-1">When someone sends you a friend request, it will appear here</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {incomingRequests.map((request) => {
                  const itemKey = request.id ?? `${request.senderId}:${request.receiverId}:${request.createdAt}`;
                  return (
                    <div key={itemKey}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <UserAvatar src={request.sender?.imageUrl} className="h-8 w-8" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-50">{request.sender?.name ?? request.senderId}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatTime(new Date(request.createdAt))}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600"
                            onClick={() => {
                              if (!request.id) {
                                console.warn("accept: missing request id", request);
                                return;
                              }
                              acceptMutation.mutate(request.id);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              if (!request.id) {
                                console.warn("reject: missing request id", request);
                                return;
                              }
                              rejectMutation.mutate(request.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Separator className="mt-2" />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="flex-1 flex flex-col m-0">
          {sentRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="text-zinc-600 dark:text-zinc-400">
                  <p className="text-sm font-medium">No sent requests</p>
                  <p className="text-xs mt-1">Friend requests you have sent will appear here</p>
                </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {sentRequests.map((request) => {
                  const itemKey = request.id ?? `${request.senderId}:${request.receiverId}:${request.createdAt}`;
                  return (
                    <div key={itemKey}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <UserAvatar src={request.receiver?.imageUrl} className="h-8 w-8" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-50">{request.receiver?.name ?? request.receiverId}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatTime(new Date(request.createdAt))}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                          onClick={() => {
                            if (!request.id) {
                              console.warn("cancel: missing request id", request);
                              return;
                            }
                            cancelMutation.mutate(request.id);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      <Separator className="mt-2" />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-700">
        <Button variant="outline" className="w-full text-xs h-8" onClick={onClose}>
          View all requests
        </Button>
      </div>
    </div>
  );
};
