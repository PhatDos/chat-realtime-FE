"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO, Socket } from "socket.io-client";
import { useAuth } from "@clerk/nextjs";
import { useApiClient } from "@/hooks/use-api-client";
import { getCurrentProfile } from "@/services/servers/servers-service";

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

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected:", socketInstance.id);
      
      // Join profile room after connection
      socketInstance.emit("profile:join", { profileId });
      console.log("👤 Emitted profile:join for profileId:", profileId);
      // Start heartbeat to keep presence alive
      try {
        const hb = setInterval(() => {
          socketInstance.emit("heartbeat", { profileId });
        }, 30000);

        socketInstance.on("disconnect", () => {
          clearInterval(hb);
        });
      } catch {
        // ignore
      }
    });
    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket DISconnected:", socketInstance.id);
    });

    setSocket(socketInstance);

    return () => {
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
