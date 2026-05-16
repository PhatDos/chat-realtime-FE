import type { ClientApi } from "@/services/client-api";
import type {
  AcceptFriendRequestResponse,
  FriendRequestDto,
  FriendshipInfoDto,
} from "@/types/api/friendship";

type FriendRequestsEnvelope = {
  status: boolean;
  code: number;
  data: {
    items: FriendRequestDto[];
    count: number;
    skip: number;
    limit: number;
  };
  message?: string;
  timestamp?: string;
};

export const sendFriendRequest = async (
  api: ClientApi,
  targetProfileId: string
) => {
  const resp = await api.post<any>(`/profiles/${targetProfileId}/friend`);
  // unwrap envelope if backend returns { status, code, data: { ... } }
  return resp && resp.data ? resp.data : resp;
};

export const getFriendshipInfo = async (
  api: ClientApi,
  targetProfileId: string
) => {
  const response = await api.get<{ data?: FriendshipInfoDto } | FriendshipInfoDto>(
    `/profiles/${targetProfileId}/friend`
  );

  return (response as { data?: FriendshipInfoDto }).data ?? (response as FriendshipInfoDto);
};

export const unfriend = async (api: ClientApi, targetProfileId: string) => {
  return api.delete<{ success: true }>(`/profiles/${targetProfileId}/friend`);
};

export const getIncomingFriendRequests = async (api: ClientApi) => {
  // Backend returns an envelope { status, code, data: { items, ... } }
  const envelope = await api.get<FriendRequestsEnvelope>("/friend-requests");
  return envelope.data.items;
};

export const getSentFriendRequests = async (api: ClientApi) => {
  const envelope = await api.get<FriendRequestsEnvelope>(
    "/friend-requests/sent"
  );
  return envelope.data.items;
};

export const getIncomingFriendRequestsEnvelope = async (
  api: ClientApi,
  params?: { skip?: number; limit?: number; status?: string }
) => {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set("skip", String(params.skip));
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  const url = "/friend-requests" + (qs.toString() ? `?${qs.toString()}` : "");
  return api.get<FriendRequestsEnvelope>(url);
};

export const getSentFriendRequestsEnvelope = async (
  api: ClientApi,
  params?: { skip?: number; limit?: number; status?: string }
) => {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set("skip", String(params.skip));
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  const url = "/friend-requests/sent" + (qs.toString() ? `?${qs.toString()}` : "");
  return api.get<FriendRequestsEnvelope>(url);
};

export const acceptFriendRequest = async (api: ClientApi, requestId: string) => {
  const resp = await api.post<any>(`/friend-requests/${requestId}/accept`);
  return resp && resp.data ? resp.data : resp;
};

export const rejectFriendRequest = async (api: ClientApi, requestId: string) => {
  const resp = await api.post<any>(`/friend-requests/${requestId}/reject`);
  return resp && resp.data ? resp.data : resp;
};

export const cancelFriendRequest = async (api: ClientApi, requestId: string) => {
  const resp = await api.delete<any>(`/friend-requests/${requestId}`);
  return resp && resp.data ? resp.data : resp;
};
