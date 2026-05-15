import type { ClientApi } from "@/services/client-api";
import type {
  AcceptFriendRequestResponse,
  FriendRequestDto,
  FriendshipInfoDto,
} from "@/types/api/friendship";

export const sendFriendRequest = async (
  api: ClientApi,
  targetProfileId: string
) => {
  return api.post<FriendRequestDto>(`/profiles/${targetProfileId}/friend`);
};

export const getFriendshipInfo = async (
  api: ClientApi,
  targetProfileId: string
) => {
  return api.get<FriendshipInfoDto>(`/profiles/${targetProfileId}/friend`);
};

export const unfriend = async (api: ClientApi, targetProfileId: string) => {
  return api.delete<{ success: true }>(`/profiles/${targetProfileId}/friend`);
};

export const getIncomingFriendRequests = async (api: ClientApi) => {
  return api.get<FriendRequestDto[]>("/friend-requests");
};

export const getSentFriendRequests = async (api: ClientApi) => {
  return api.get<FriendRequestDto[]>("/friend-requests/sent");
};

export const acceptFriendRequest = async (api: ClientApi, requestId: string) => {
  return api.post<AcceptFriendRequestResponse>(
    `/friend-requests/${requestId}/accept`
  );
};

export const rejectFriendRequest = async (api: ClientApi, requestId: string) => {
  return api.post<FriendRequestDto>(`/friend-requests/${requestId}/reject`);
};

export const cancelFriendRequest = async (api: ClientApi, requestId: string) => {
  return api.delete<FriendRequestDto>(`/friend-requests/${requestId}`);
};
