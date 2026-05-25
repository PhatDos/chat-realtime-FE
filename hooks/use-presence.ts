"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useApiClient } from "@/hooks/use-api-client";

export function usePresence(profileIds: string[] = []) {
  const api = useApiClient();
  const { socket } = useSocket();
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const idsKey = profileIds.join(",");

  // Initial batch fetch of presence
  useEffect(() => {
    let mounted = true;
    if (profileIds.length === 0) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await api.post<{ data: Record<string, boolean> }>(
          "/presence",
          { profileIds }
        );
        if (mounted) {
          setPresence(res?.data ?? {});
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching presence batch:", err);
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // use idsKey so effect only runs when the list content changes
  }, [api, idsKey]);

  useEffect(() => {
    if (!socket) return;
    const onOnline = (payload: { profileId: string }) => {
      setPresence((p) => ({ ...p, [payload.profileId]: true }));
    };
    const onOffline = (payload: { profileId: string }) => {
      setPresence((p) => ({ ...p, [payload.profileId]: false }));
    };

    socket.on("presence:online", onOnline);
    socket.on("presence:offline", onOffline);

    return () => {
      socket.off("presence:online", onOnline);
      socket.off("presence:offline", onOffline);
    };
  }, [socket]);

  return { presence, loading };
}
