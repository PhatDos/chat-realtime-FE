import { fetchWithAuth } from "@/lib/server-api-client";
import type { FeedPost } from "@/components/newsfeed/types";

export const getPost = async (postId: string) => {
  const response = await fetchWithAuth((client, config) =>
    client.get<FeedPost>(`/posts/${postId}`, config)
  );

  return response.data;
};