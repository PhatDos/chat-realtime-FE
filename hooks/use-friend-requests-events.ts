"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { FRIEND_REQUESTS_EVENTS_URL, buildBearerHeaders } from "@/lib/sse-client";
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
  request?: any;
  friendId?: string;
};

export const useFriendRequestsEvents = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

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
              switch (payload.type) {
                case "FRIEND_REQUEST_CREATED": {
                  queryClient.setQueryData(
                    ["friend-status", payload.actorProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.actorProfileId,
                      name: current?.name ?? "",
                      imageUrl: current?.imageUrl ?? "",
                      isFriend: false,
                      pendingRequest: payload.request
                        ? { id: payload.request.id, direction: "received" as const }
                        : null,
                    })
                  );

                  queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] });
                  queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming", "envelope"] });
                  break;
                }
                case "FRIEND_REQUEST_ACCEPTED": {
                  queryClient.setQueryData(
                    ["friend-status", payload.actorProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.actorProfileId,
                      name: current?.name ?? "",
                      imageUrl: current?.imageUrl ?? "",
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

                  queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] });
                  queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] });
                  break;
                }
                case "FRIEND_REQUEST_REJECTED": {
                  queryClient.setQueryData(
                    ["friend-status", payload.actorProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.actorProfileId,
                      name: current?.name ?? "",
                      imageUrl: current?.imageUrl ?? "",
                      isFriend: false,
                      pendingRequest: null,
                    })
                  );

                  queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] });
                  break;
                }
                case "FRIEND_REQUEST_CANCELLED": {
                  queryClient.setQueryData(
                    ["friend-status", payload.actorProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.actorProfileId,
                      name: current?.name ?? "",
                      imageUrl: current?.imageUrl ?? "",
                      isFriend: false,
                      pendingRequest: null,
                    })
                  );

                  queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] });
                  break;
                }
                case "FRIEND_REMOVED": {
                  queryClient.setQueryData(
                    ["friend-status", payload.actorProfileId],
                    (current: FriendshipInfoDto | undefined) => ({
                      id: payload.actorProfileId,
                      name: current?.name ?? "",
                      imageUrl: current?.imageUrl ?? "",
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
  }, [getToken, queryClient]);
};
