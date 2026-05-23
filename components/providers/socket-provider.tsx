"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO, Socket } from "socket.io-client";
import { useAuth } from "@clerk/nextjs";
import { useApiClient } from "@/hooks/use-api-client";
import { getCurrentProfile } from "@/services/servers/servers-service";
import { useFriendRequestsEvents } from "@/hooks/use-friend-requests-events";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { userId } = useAuth();
  const apiClient = useApiClient();

  useFriendRequestsEvents();

  useEffect(() => {
    if (!userId) {
      setProfileId(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const profile = await getCurrentProfile(apiClient);
        setProfileId(profile.id);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [userId, apiClient]);

  useEffect(() => {
    if (!profileId) return;

    console.log("SocketProvider rendered", process.env.NEXT_PUBLIC_SITE_URL!);

    const socketInstance = ClientIO(process.env.NEXT_PUBLIC_SITE_URL!, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      secure: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    let heartbeatInterval: NodeJS.Timeout | null = null;

    const emitPresenceJoin = () => {
      socketInstance.emit("profile:join", { profileId });
      console.log("📍 Emitted profile:join for profileId:", profileId);
    };

    const emitPresencePing = () => {
      socketInstance.emit("presence:ping", { profileId });
      console.log("💓 Emitted presence:ping for profileId:", profileId);
    };

    const startHeartbeat = () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        emitPresencePing();
      }, 30000); // 30s heartbeat
    };

    const stopHeartbeat = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    };

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected:", socketInstance.id);
      emitPresenceJoin();
      startHeartbeat();
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      stopHeartbeat();
      console.log("Socket DISconnected:", socketInstance.id);
    });

    socketInstance.on("reconnect", () => {
      console.log("Socket reconnected:", socketInstance.id);
      emitPresenceJoin();
      startHeartbeat();
    });

    // Visibility/focus handling
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab became visible, sending immediate ping");
        emitPresencePing();
      }
    };

    const handleFocus = () => {
      console.log("Window focused, sending immediate ping");
      emitPresencePing();
    };

    // Page unload handler
    const handleBeforeUnload = () => {
      emitPresencePing();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("beforeunload", handleBeforeUnload);

    setSocket(socketInstance);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      try {
        socketInstance.disconnect();
      } catch {
        /* ignore */
      }
    };
  }, [profileId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
