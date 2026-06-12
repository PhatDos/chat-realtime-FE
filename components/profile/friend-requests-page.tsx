"use client";

import Link from "next/link";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Loader2, Mail, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getIncomingFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
} from "@/services/friends-client-service";
import type { FriendRequestListItemDto } from "@/types/api/friendship";

const getRequestStatusBadgeClass = (status: FriendRequestListItemDto["status"]) => {
  if (status === "PENDING") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300";
  }

  if (status === "ACCEPTED") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  return "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
};

export const FriendRequestsPage = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
    const router = useRouter();

  const incomingQuery = useQuery<
    FriendRequestListItemDto[],
    AxiosError<{ message?: string }>,
    FriendRequestListItemDto[]
  >({
    queryKey: ["friend-requests", "incoming"],
    queryFn: async () => getIncomingFriendRequests(api),
    retry: false,
  });

  const sentQuery = useQuery<
    FriendRequestListItemDto[],
    AxiosError<{ message?: string }>,
    FriendRequestListItemDto[]
  >({
    queryKey: ["friend-requests", "sent"],
    queryFn: async () => getSentFriendRequests(api),
    retry: false,
  });

  const refreshFriendRequestData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] }),
      queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] }),
      queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming", "envelope"] }),
      queryClient.invalidateQueries({ queryKey: ["friend-status"] }),
      queryClient.invalidateQueries({ queryKey: ["friends"] }),
    ]);
  };

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => acceptFriendRequest(api, requestId),
    onSuccess: async () => {
      await refreshFriendRequestData();
      toast({
        title: "Friend request accepted",
        description: "You are now friends.",
        variant: "success",
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast({
        title: "Cannot accept request",
        description:
          error.response?.data?.message ??
          "Failed to accept friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => rejectFriendRequest(api, requestId),
    onSuccess: async () => {
      await refreshFriendRequestData();
      toast({
        title: "Friend request rejected",
        description: "The request has been removed.",
        variant: "success",
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast({
        title: "Cannot reject request",
        description:
          error.response?.data?.message ??
          "Failed to reject friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => cancelFriendRequest(api, requestId),
    onSuccess: async () => {
      await refreshFriendRequestData();
      toast({
        title: "Friend request canceled",
        description: "Your sent request has been canceled.",
        variant: "success",
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast({
        title: "Cannot cancel request",
        description:
          error.response?.data?.message ??
          "Failed to cancel friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const incomingRequests = incomingQuery.data ?? [];
  const sentRequests = sentQuery.data ?? [];
  const pendingSentRequests = sentRequests.filter(
    (request) => request.status === "PENDING"
  );

  const isMutating =
    acceptMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Friend Requests
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage incoming invitations and track requests you have sent.
          </p>
        </div>

        <Link href="/newsfeed">
          <Button variant="outline" size="sm"
            className="rounded-full border border-zinc-200/80 bg-white/80 px-4 text-zinc-700 hover:bg-white hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
            Back to Newsfeed
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="incoming" className="gap-2">
            <Mail className="h-4 w-4" />
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Sent ({pendingSentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-3">
          {incomingQuery.isLoading ? (
            <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31]">
              <CardContent className="p-6 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading incoming requests...
              </CardContent>
            </Card>
          ) : incomingRequests.length === 0 ? (
            <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31]">
              <CardContent className="p-6 text-center text-zinc-600 dark:text-zinc-400">
                No pending incoming requests.
              </CardContent>
            </Card>
          ) : (
            incomingRequests.map((request) => (
              <Card
                key={request.id}
                className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31]"
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={request.actorProfile?.imageUrl} className="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                        {request.actorProfile?.name ?? "Unknown sender"}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => acceptMutation.mutate(request.id)}
                      disabled={isMutating}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={isMutating}
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          {sentQuery.isLoading ? (
            <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31]">
              <CardContent className="p-6 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading sent requests...
              </CardContent>
            </Card>
          ) : sentRequests.length === 0 ? (
            <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31]">
              <CardContent className="p-6 text-center text-zinc-600 dark:text-zinc-400">
                You have not sent any friend requests yet.
              </CardContent>
            </Card>
          ) : (
            sentRequests.map((request) => (
              <Card
                key={request.id}
                className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31]"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between gap-3">
                    <span className="truncate">{request.actorProfile?.name ?? "Unknown receiver"}</span>
                    <Badge className={getRequestStatusBadgeClass(request.status)}>
                      {request.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={request.actorProfile?.imageUrl} className="h-9 w-9" />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Sent {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {request.status === "PENDING" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 shrink-0"
                      onClick={() => cancelMutation.mutate(request.id)}
                      disabled={isMutating}
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
