import type { ClientApi } from "@/services/client-api";
import type { UserProfileDto } from "@/types/api/user";
import type { FriendshipInfoDto } from "@/types/api/friendship";
import type { FeedPost } from "@/components/newsfeed/types";

export const getUserProfile = async (api: ClientApi, userId: string) => {
  return api.get<UserProfileDto>(`/users/${userId}`);
};

export const getUserFriendStatus = async (api: ClientApi, userId: string) => {
  const response = await api.get<{ data?: FriendshipInfoDto } | FriendshipInfoDto>(
    `/profiles/${userId}/friend`
  );

  return (response as { data?: FriendshipInfoDto }).data ?? (response as FriendshipInfoDto);
};

export const getUserPosts = async (
  api: ClientApi,
  userId: string,
  cursor: string | null = null,
  limit: number = 10
) => {
  return api.get<{ items: FeedPost[]; nextCursor: string | null }>(
    `/users/${userId}/posts`,
    {
      params: {
        ...(cursor && { cursor }),
        limit,
      },
    }
  );
};
