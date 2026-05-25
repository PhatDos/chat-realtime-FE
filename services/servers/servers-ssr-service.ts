'use server';

import type {
  ChannelResponse,
} from "@/types/api/channel";
import type {
  InitialServerResponse,
  ServerMeResponse,
  ServerSidebarResponse,
} from "@/types/api/server";
import { fetchWithAuth } from "@/lib/server-api-client";

// Server-side only functions (for Server Components)
export const getInitialServer = async () => {
  try {
    const response = await fetchWithAuth((client, config) =>
      client.get<InitialServerResponse>("/servers/initial", config)
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getChannel = async (serverId: string, channelId: string) => {
  try {
    const response = await fetchWithAuth((client, config) =>
      client.get<ChannelResponse>(`/servers/${serverId}/channels/${channelId}`, config)
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getServerMe = async (serverId: string) => {
  try {
    const response = await fetchWithAuth((client, config) =>
      client.get<ServerMeResponse>(`/servers/${serverId}/me`, config)
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getServerSidebarData = async (serverId: string) => {
  try {
    const response = await fetchWithAuth((client, config) =>
      client.get<ServerSidebarResponse>(`/servers/${serverId}/sidebar`, config)
    );
    return response.data;
  } catch (error) {
    return null;
  }
};
