"use client";

import { useCallback, useEffect } from "react";
import { useAuth, useSession } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { FRIEND_REQUESTS_EVENTS_URL, buildBearerHeaders, isJwtExpired } from "@/lib/sse-client";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentProfile } from "@/services/servers/servers-service";
import type { FriendshipInfoDto } from "@/types/api/friendship";

type FriendRequestEventType =
  | "FRIEND_REQUEST_CREATED"
  | "FRIEND_REQUEST_ACCEPTED"
  | "FRIEND_REQUEST_REJECTED"
  | "FRIEND_REQUEST_CANCELLED"
  | "FRIEND_REMOVED";

type FriendRequestEventPayload = {
  type: FriendRequestEventType;
  audienceProfileId: string;
  actorProfileId: string;
  actorProfile: {
    id: string;
    name: string;
    imageUrl: string;
  };
  request?: {
    id: string;
    fromProfileId: string;
    toProfileId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  friendId?: string;
};

const SSE_RETRY_DELAY_MS = 10_000;

export const FRIEND_EVENT_MAPPING: Record<
  FriendRequestEventType,
  { title: string; getMessage: (payload: FriendRequestEventPayload) => string }
> = {
  FRIEND_REQUEST_CREATED: {
    title: "Friend request created",
    getMessage: (payload) => `${payload.actorProfile.name} sent you a friend request`,
  },
  FRIEND_REQUEST_ACCEPTED: {
    title: "Friend request accepted",
    getMessage: (payload) => `${payload.actorProfile.name} accepted your friend request`,
  },
  FRIEND_REQUEST_REJECTED: {
    title: "Friend request rejected",
    getMessage: (payload) => `${payload.actorProfile.name} rejected your friend request`,
  },
  FRIEND_REQUEST_CANCELLED: {
    title: "Friend request cancelled",
    getMessage: (payload) => `${payload.actorProfile.name} cancelled the friend request`,
  },
  FRIEND_REMOVED: {
    title: "Friend removed",
    getMessage: (payload) => `${payload.actorProfile.name} removed you from friends`,
  },
};

export const useFriendRequestsEvents = () => {
  const { getToken } = useAuth();
  const { session } = useSession();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: currentProfile } = useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => getCurrentProfile(api),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
  const currentProfileId = currentProfile?.id;

  const getFreshSseToken = useCallback(async () => {
    let token = await getToken();

    if (!token || isJwtExpired(token)) {
      await session?.reload();
      token = await getToken({ skipCache: true });
    }

    if (isJwtExpired(token, 0)) {
      throw new Error("SSE_TOKEN_EXPIRED");
    }

    return token;
  }, [getToken, session]);

  const updateIncomingEnvelopeCount = (delta: number) => {
    queryClient.setQueryData(
      ["friend-requests", "incoming", "envelope"],
      (current: { data?: { count: number; skip: number; limit: number } } | undefined) => {
        if (!current?.data) return current;
        return {
          ...current,
          data: {
            ...current.data,
            count: Math.max(0, current.data.count + delta),
          },
        };
      }
    );
  };

  const refetchNotificationContent = () => {
    queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] });
    queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] });
    queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming", "envelope"] });
    queryClient.invalidateQueries({ queryKey: ["friends"] });
  };

  const upsertIncomingFromEvent = (payload: FriendRequestEventPayload) => {
    if (!payload.request) return;

    queryClient.setQueryData(
      ["friend-requests", "incoming"],
      (
        current:
          | Array<{
              id: string;
              fromProfileId: string;
              toProfileId: string;
              status: string;
              createdAt: string;
              updatedAt: string;
              actorProfile?: { id: string; name: string; imageUrl: string };
            }>
          | undefined
      ) => {
        const nextItem = {
          id: payload.request!.id,
          fromProfileId: payload.request!.fromProfileId,
          toProfileId: payload.request!.toProfileId,
          status: payload.request!.status,
          createdAt: payload.request!.createdAt,
          updatedAt: payload.request!.updatedAt,
          actorProfile: payload.actorProfile
            ? {
                id: payload.actorProfile.id,
                name: payload.actorProfile.name,
                imageUrl: payload.actorProfile.imageUrl,
              }
            : undefined,
        };

        const list = current ?? [];
        const idx = list.findIndex((item) => item.id === nextItem.id);
        if (idx >= 0) {
          const cloned = [...list];
          cloned[idx] = { ...cloned[idx], ...nextItem };
          return cloned;
        }

        return [nextItem, ...list];
      }
    );
  };

  const removeRequestFromList = (queryKey: string[], requestId?: string) => {
    if (!requestId) return;

    queryClient.setQueryData(
      queryKey,
      (current: Array<{ id: string }> | undefined) =>
        (current ?? []).filter((item) => item.id !== requestId)
    );
  };

  useEffect(() => {
    let isActive = true;
    let controller: AbortController | null = null;
    let retryTimeoutId: number | null = null;

    const start = async () => {
      try {
        const token = await getFreshSseToken();

        if (!isActive) {
          return;
        }

        controller = new AbortController();

        await fetchEventSource(FRIEND_REQUESTS_EVENTS_URL, {
          method: "GET",
          headers: buildBearerHeaders(token),
          signal: controller.signal,
          openWhenHidden: true,
          onopen: async (res) => {
            if (res.status === 401) {
              throw new Error("SSE_UNAUTHORIZED");
            }

            if (!res.ok) {
              throw new Error(`SSE failed: ${res.status}`);
            }
          },
          onmessage: (ev) => {
            try {
              const payload: FriendRequestEventPayload = JSON.parse(ev.data);
              const actorProfileName = payload.actorProfile?.name ?? "Unknown";
              const actorProfileImageUrl = payload.actorProfile?.imageUrl ?? "";
              const isAudience = currentProfileId === payload.audienceProfileId;

              const notifyFromMapping = () => {
                if (!isAudience) return;
                const mapping = FRIEND_EVENT_MAPPING[payload.type];
                toast({
                  title: mapping.title,
                  description: mapping.getMessage(payload),
                  variant: "success",
                });
              };

              switch (payload.type) {
                case "FRIEND_REQUEST_CREATED": {
                  const fromProfileId = payload.request?.fromProfileId ?? payload.actorProfileId;

                  if (payload.request) {
                    queryClient.setQueryData(
                      ["friend-status", fromProfileId],
                      (current: FriendshipInfoDto | undefined) => ({
                        id: fromProfileId,
                        name: current?.name ?? actorProfileName,
                        imageUrl: current?.imageUrl ?? actorProfileImageUrl,
                        isFriend: false,
                        pendingRequest: {
                          id: payload.request!.id,
                          direction: "received" as const,
                        },
                      })
                    );
                  }

                  if (isAudience) {
                    upsertIncomingFromEvent(payload);
                    updateIncomingEnvelopeCount(1);
                    notifyFromMapping();
                  }

                  refetchNotificationContent();
                  break;
                }
                case "FRIEND_REQUEST_ACCEPTED": {
                  const fromProfileId = payload.request?.fromProfileId ?? payload.actorProfileId;
                  const toProfileId = payload.request?.toProfileId ?? payload.audienceProfileId;

                  queryClient.setQueryData(
                    ["friend-status", fromProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: fromProfileId,
                      name: current?.name ?? actorProfileName,
                      imageUrl: current?.imageUrl ?? actorProfileImageUrl,
                      isFriend: true,
                      pendingRequest: null,
                    })
                  );
                  queryClient.setQueryData(
                    ["friend-status", toProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: toProfileId,
                      name: current?.name ?? "",
                      imageUrl: current?.imageUrl ?? "",
                      isFriend: true,
                      pendingRequest: null,
                    })
                  );

                  refetchNotificationContent();

                  if (isAudience) {
                    removeRequestFromList(["friend-requests", "sent"], payload.request?.id);
                    notifyFromMapping();
                  }
                  break;
                }
                case "FRIEND_REQUEST_REJECTED": {
                  const fromProfileId = payload.request?.fromProfileId ?? payload.actorProfileId;
                  const toProfileId = payload.request?.toProfileId ?? payload.audienceProfileId;

                  queryClient.setQueryData(
                    ["friend-status", fromProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: fromProfileId,
                      name: current?.name ?? actorProfileName,
                      imageUrl: current?.imageUrl ?? actorProfileImageUrl,
                      isFriend: false,
                      pendingRequest: null,
                    })
                  );
                  queryClient.setQueryData(
                    ["friend-status", toProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: toProfileId,
                      name: current?.name ?? actorProfileName,
                      imageUrl: current?.imageUrl ?? actorProfileImageUrl,
                      isFriend: false,
                      pendingRequest: null,
                    })
                  );

                  refetchNotificationContent();

                  if (isAudience) {
                    removeRequestFromList(["friend-requests", "sent"], payload.request?.id);
                    notifyFromMapping();
                  }
                  break;
                }
                case "FRIEND_REQUEST_CANCELLED": {
                  const fromProfileId = payload.request?.fromProfileId ?? payload.actorProfileId;
                  const toProfileId = payload.request?.toProfileId ?? payload.audienceProfileId;

                  queryClient.setQueryData(
                    ["friend-status", fromProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: fromProfileId,
                      name: current?.name ?? actorProfileName,
                      imageUrl: current?.imageUrl ?? actorProfileImageUrl,
                      isFriend: false,
                      pendingRequest: null,
                    })
                  );
                  queryClient.setQueryData(
                    ["friend-status", toProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: toProfileId,
                      name: current?.name ?? actorProfileName,
                      imageUrl: current?.imageUrl ?? actorProfileImageUrl,
                      isFriend: false,
                      pendingRequest: null,
                    })
                  );

                  refetchNotificationContent();

                  if (isAudience) {
                    removeRequestFromList(["friend-requests", "incoming"], payload.request?.id);
                    updateIncomingEnvelopeCount(-1);
                    notifyFromMapping();
                  }
                  break;
                }
                case "FRIEND_REMOVED": {
                  queryClient.setQueryData(
                    ["friend-status", payload.actorProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.actorProfileId,
                      name: current?.name ?? actorProfileName,
                      imageUrl: current?.imageUrl ?? actorProfileImageUrl,
                      isFriend: false,
                      pendingRequest: null,
                    })
                  );
                  queryClient.setQueryData(
                    ["friend-status", payload.audienceProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.audienceProfileId,
                      name: current?.name ?? "",
                      imageUrl: current?.imageUrl ?? "",
                      isFriend: false,
                      pendingRequest: null,
                    })
                  );

                  refetchNotificationContent();
                  notifyFromMapping();
                  break;
                }
                default:
                  break;
              }
            } catch (err) {
              // ignore parse error
            }
          },
          onclose: () => {
            throw new Error("SSE connection closed");
          },
          onerror: (err) => {
            throw err;
          },
        });
      } catch (err) {
        if (!isActive || controller?.signal.aborted) {
          return;
        }

        console.error("Friend request SSE reconnecting after error:", err);
        retryTimeoutId = window.setTimeout(start, SSE_RETRY_DELAY_MS);
      }
    };

    start();

    return () => {
      isActive = false;

      if (retryTimeoutId !== null) {
        window.clearTimeout(retryTimeoutId);
      }

      controller?.abort();
    };
  }, [getFreshSseToken, queryClient, currentProfileId, toast]);
};
