"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/user-avatar";
import { Check, X, Loader2, Bell } from "lucide-react";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { FriendRequestListItemDto, FriendshipInfoDto } from "@/types/api/friendship";
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
  const { toast } = useToast();
  const router = useRouter();

  const incomingQuery = useQuery<FriendRequestListItemDto[]>({
    queryKey: ["friend-requests", "incoming"],
    queryFn: async () => getIncomingFriendRequests(api),
  });

  const sentQuery = useQuery<FriendRequestListItemDto[]>({
    queryKey: ["friend-requests", "sent"],
    queryFn: async () => getSentFriendRequests(api),
  });

  const syncAcceptedFriendship = (request: FriendRequestListItemDto) => {
    const actor = request.actorProfile;
    const otherId = actor?.id === request.fromProfileId ? request.toProfileId : request.fromProfileId;

    if (actor) {
      queryClient.setQueryData<FriendshipInfoDto>(["friend-status", actor.id], (current) => ({
        ...(current ?? {
          id: actor.id,
          name: actor.name,
          imageUrl: actor.imageUrl,
          isFriend: false,
        }),
        id: actor.id,
        name: current?.name ?? actor.name,
        imageUrl: current?.imageUrl ?? actor.imageUrl,
        isFriend: true,
        pendingRequest: null,
      }));
    }

    if (otherId) {
      queryClient.setQueryData<FriendshipInfoDto>(["friend-status", otherId], (current: FriendshipInfoDto | undefined) => ({
        ...(current ?? {
          id: otherId,
          name: "",
          imageUrl: "",
          isFriend: false,
        }),
        id: otherId,
        name: current?.name ?? "",
        imageUrl: current?.imageUrl ?? "",
        isFriend: true,
        pendingRequest: null,
      }));
    }
  };

  const syncRejectedOrCanceledFriendship = (request: FriendRequestListItemDto) => {
    const actor = request.actorProfile;
    const otherId = actor?.id === request.fromProfileId ? request.toProfileId : request.fromProfileId;

    if (actor) {
      queryClient.setQueryData<FriendshipInfoDto>(["friend-status", actor.id], (current) => ({
        ...(current ?? {
          id: actor.id,
          name: actor.name,
          imageUrl: actor.imageUrl,
          isFriend: false,
        }),
        id: actor.id,
        name: current?.name ?? actor.name,
        imageUrl: current?.imageUrl ?? actor.imageUrl,
        isFriend: false,
        pendingRequest: null,
      }));
    }

    if (otherId) {
      queryClient.setQueryData<FriendshipInfoDto>(["friend-status", otherId], (current: FriendshipInfoDto | undefined) => ({
        ...(current ?? {
          id: otherId,
          name: "",
          imageUrl: "",
          isFriend: false,
        }),
        id: otherId,
        name: current?.name ?? "",
        imageUrl: current?.imageUrl ?? "",
        isFriend: false,
        pendingRequest: null,
      }));
    }
  };

  const acceptMutation = useMutation({
    mutationFn: (request: FriendRequestListItemDto) => acceptFriendRequest(api, request.id),
    onSuccess: async (_result, request) => {
      syncAcceptedFriendship(request);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming", "envelope"] }),
        queryClient.invalidateQueries({ queryKey: ["friend-status"] }),
        queryClient.invalidateQueries({ queryKey: ["friends"] }),
      ]);
      {
        const actorName = request.actorProfile?.name ?? request.fromProfileId;
        toast({
          title: "Friend request accepted",
          description: `${actorName} and you are now friends.`,
          variant: "success",
        });
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (request: FriendRequestListItemDto) => rejectFriendRequest(api, request.id),
    onSuccess: async (_result, request) => {
      syncRejectedOrCanceledFriendship(request);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming", "envelope"] }),
      ]);
      {
        const actorName = request.actorProfile?.name ?? request.fromProfileId;
        toast({
          title: "Friend request rejected",
          description: `${actorName}'s request was removed.`,
          variant: "success",
        });
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (request: FriendRequestListItemDto) => cancelFriendRequest(api, request.id),
    onSuccess: async (_result, request) => {
      syncRejectedOrCanceledFriendship(request);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming", "envelope"] }),
      ]);
      {
        const targetName = request.actorProfile?.name ?? request.toProfileId ?? request.fromProfileId;
        toast({
          title: "Friend request canceled",
          description: `Request to ${targetName} was canceled.`,
          variant: "success",
        });
      }
    },
  });

  const incomingRequests = incomingQuery.data || [];
  const sentRequests = sentQuery.data || [];

  const isAnyPending = acceptMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

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
    <div className="flex flex-col h-[400px] w-80 bg-gradient-to-br from-white to-zinc-50 dark:from-[#1e1f22] dark:to-[#111113] rounded-2xl shadow-xl border border-zinc-200/50 dark:border-zinc-800/80 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-white/50 dark:bg-[#1e1f22]/50 backdrop-blur-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-indigo-500" />
            Notifications
          </h3>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Friend requests and updates</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incoming" className="flex-1 flex flex-col m-0 overflow-hidden border-0">
        <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-zinc-100/50 dark:bg-[#111113]/55 border-b border-zinc-100 dark:border-zinc-800/50 rounded-none">
          <TabsTrigger
            value="incoming"
            className="rounded-lg font-semibold text-xs py-1.5 transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-[#2b2d31] data-[state=active]:shadow-sm data-[state=active]:text-indigo-500 dark:data-[state=active]:text-indigo-400 text-zinc-500 dark:text-zinc-400"
          >
            Incoming
            {incomingRequests.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full leading-none">
                {incomingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="rounded-lg font-semibold text-xs py-1.5 transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-[#2b2d31] data-[state=active]:shadow-sm data-[state=active]:text-indigo-500 dark:data-[state=active]:text-indigo-400 text-zinc-500 dark:text-zinc-400"
          >
            Sent
            {sentRequests.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full leading-none">
                {sentRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Incoming Requests Tab */}
        <TabsContent value="incoming" className="flex-1 flex flex-col m-0 overflow-hidden data-[state=inactive]:hidden">
          {incomingRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No incoming requests</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px]">
                When someone sends you a friend request, it will appear here.
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {incomingRequests.map((request) => {
                  const itemKey = request.id ?? `${request.fromProfileId}:${request.toProfileId}:${request.createdAt}`;
                  const isAccepting = acceptMutation.isPending && acceptMutation.variables?.id === request.id;
                  const isRejecting = rejectMutation.isPending && rejectMutation.variables?.id === request.id;

                  return (
                    <div key={itemKey} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 border border-transparent hover:border-zinc-200/10 dark:hover:border-zinc-700/10 transition-all duration-200">
                      <div className="relative">
                        <UserAvatar src={request.actorProfile?.imageUrl} className="h-9 w-9 shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-zinc-950 dark:text-zinc-50">
                          {request.actorProfile?.name ?? request.fromProfileId}
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                          {formatTime(new Date(request.createdAt))}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          disabled={isAnyPending}
                          className="h-8 w-8 p-0 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-90"
                          onClick={() => {
                            if (!request.id) return;
                            acceptMutation.mutate(request);
                          }}
                        >
                          {isAccepting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          disabled={isAnyPending}
                          className="h-8 w-8 p-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#2b2d31] hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-500 hover:text-red-500 dark:text-zinc-400 transition-all duration-200 active:scale-90"
                          onClick={() => {
                            if (!request.id) return;
                            rejectMutation.mutate(request);
                          }}
                        >
                          {isRejecting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="flex-1 flex flex-col m-0 overflow-hidden data-[state=inactive]:hidden">
          {sentRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No sent requests</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px]">
                Friend requests you have sent will appear here.
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {sentRequests.map((request) => {
                  const itemKey = request.id ?? `${request.fromProfileId}:${request.toProfileId}:${request.createdAt}`;
                  const isCanceling = cancelMutation.isPending && cancelMutation.variables?.id === request.id;

                  return (
                    <div key={itemKey} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 border border-transparent hover:border-zinc-200/10 dark:hover:border-zinc-700/10 transition-all duration-200">
                      <div className="relative">
                        <UserAvatar src={request.actorProfile?.imageUrl} className="h-9 w-9 shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-zinc-950 dark:text-zinc-50">
                          {request.actorProfile?.name ?? request.toProfileId}
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                          Sent {formatTime(new Date(request.createdAt))}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={isAnyPending}
                        className="h-8 px-3 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#2b2d31] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all duration-200 active:scale-95 shrink-0"
                        onClick={() => {
                          if (!request.id) return;
                          cancelMutation.mutate(request);
                        }}
                      >
                        {isCanceling ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        {isCanceling ? "Canceling" : "Cancel"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 backdrop-blur-sm">
        <Button
          className="w-full text-xs font-semibold h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500"
          onClick={() => {
            onClose?.();
            router.push("/friend-requests");
          }}
        >
          View all requests
        </Button>
      </div>
    </div>
  );
};
