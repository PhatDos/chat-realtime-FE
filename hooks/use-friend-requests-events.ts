"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { FRIEND_REQUESTS_EVENTS_URL, buildBearerHeaders } from "@/lib/sse-client";
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
    const controller = new AbortController();

    const start = async () => {
      const token = await getToken({ skipCache: true });
      try {
        await fetchEventSource(FRIEND_REQUESTS_EVENTS_URL, {
          method: "GET",
          headers: buildBearerHeaders(token),
          signal: controller.signal,
          openWhenHidden: true,
          onopen: async (res) => {
            // non-200 means server didn't accept connection
            if (res && res.status && res.status !== 200) {
              // allow fetchEventSource to handle retries; nothing to do here
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
                  queryClient.setQueryData(
                    ["friend-status", payload.actorProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.actorProfileId,
                      name: current?.name ?? actorProfileName,
                      imageUrl: current?.imageUrl ?? actorProfileImageUrl,
                      isFriend: false,
                      pendingRequest: payload.request
                        ? { id: payload.request.id, direction: "received" as const }
                        : null,
                    })
                  );

                  if (isAudience) {
                    upsertIncomingFromEvent(payload);
                    updateIncomingEnvelopeCount(1);
                    notifyFromMapping();
                  }

                  refetchNotificationContent();
                  break;
                }
                case "FRIEND_REQUEST_ACCEPTED": {
                  queryClient.setQueryData(
                    ["friend-status", payload.actorProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.actorProfileId,
                      name: current?.name ?? actorProfileName,
                      imageUrl: current?.imageUrl ?? actorProfileImageUrl,
                      isFriend: true,
                      pendingRequest: null,
                    })
                  );
                  queryClient.setQueryData(
                    ["friend-status", payload.audienceProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.audienceProfileId,
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

                  refetchNotificationContent();

                  if (isAudience) {
                    removeRequestFromList(["friend-requests", "sent"], payload.request?.id);
                    notifyFromMapping();
                  }
                  break;
                }
                case "FRIEND_REQUEST_CANCELLED": {
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
            // noop
          },
          onerror: () => {
            // let fetchEventSource handle retries
          },
        });
      } catch (e) {
        // ignore
      }
    };

    start();

    return () => {
      try {
        controller.abort();
      } catch {}
    };
  }, [getToken, queryClient, currentProfileId, toast]);
};
