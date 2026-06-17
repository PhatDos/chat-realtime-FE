import type { ClientApi } from "@/services/client-api";
import type {
  CurrentProfileResponse,
  ServerDiscoverySummary,
  ServerSearchResponse,
  ServerPaginationResponse,
  ServerResponse,
  ServerVisibility,
  ServerSummary,
  ServerUnreadResponse,
} from "@/types/api/server";

export type { ServerPaginationResponse, ServerSummary };

export const getServerUnread = async (api: ClientApi, serverId: string) => {
  return api.get<ServerUnreadResponse>(`/servers/${serverId}/unread`);
};

export const getServers = async (
  api: ClientApi,
  skip: number,
  limit: number,
) => {
  return api.get<ServerPaginationResponse>(`/servers?skip=${skip}&limit=${limit}`);
};

export const createServer = async (
  api: ClientApi,
  values: { name: string; imageUrl: string; description?: string; visibility?: ServerVisibility },
) => {
  return api.post<ServerResponse>("/servers", values);
};

export const searchServers = async (
  api: ClientApi,
  query: string,
  limit: number = 20,
) => {
  const items = await api.get<ServerDiscoverySummary[]>(`/servers/search`, {
    params: {
      q: query,
      limit,
    },
  });

  return { items } satisfies ServerSearchResponse;
};

export const getTopPublicServers = async (api: ClientApi) => {
  return api.get<ServerDiscoverySummary[]>("/servers/discover/top");
};

export const updateServer = async (
  api: ClientApi,
  serverId: string,
  values: { name: string; imageUrl: string; description?: string; visibility?: ServerVisibility },
) => {
  return api.patch<ServerResponse>(`/servers/${serverId}`, values);
};

export const deleteServer = async (api: ClientApi, serverId: string) => {
  return api.delete(`/servers/${serverId}`);
};

export const leaveServer = async (api: ClientApi, serverId: string) => {
  return api.patch(`/servers/${serverId}/leave`);
};

export const refreshServerInviteCode = async (
  api: ClientApi,
  serverId: string,
) => {
  return api.patch<ServerResponse>(`/servers/${serverId}/invite-code`);
};

export const joinServerByInviteCode = async (
  api: ClientApi,
  inviteCode: string,
) => {
  return api.post<ServerResponse>(`servers/invite/${inviteCode}`, {});
};

export const getCurrentProfile = async (api: ClientApi) => {
  return api.get<CurrentProfileResponse>("/profile");
};
