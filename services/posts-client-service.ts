import type { FeedComment, FeedPost } from "@/components/newsfeed/types";
import type { ClientApi } from "@/services/client-api";

export type CreatePostInput = {
  content?: string;
  fileUrl?: string;
  fileType?: "text" | "img" | "pdf";
  visibility?: "PUBLIC" | "FRIENDS" | "PRIVATE";
};

export type PostsPageResponse = {
  items: FeedPost[];
  nextCursor: string | null;
};

export type SearchPostsResponse = {
  items: FeedPost[];
};

export const createPost = async (api: ClientApi, payload: CreatePostInput) => {
  return api.post<FeedPost>("/posts", payload);
};

export const getPost = async (api: ClientApi, postId: string) => {
  return api.get<FeedPost>(`/posts/${postId}`);
};

export const getUserPosts = async (
  api: ClientApi,
  cursor: string | null,
  limit: number
) => {
  return api.get<PostsPageResponse>(`/posts`, {
    params: {
      cursor: cursor ?? undefined,
      limit,
    },
  });
};

export const searchPosts = async (
  api: ClientApi,
  query: string,
  limit: number = 20,
) => {
  return api.get<SearchPostsResponse>(`/posts/search`, {
    params: {
      q: query,
      limit,
    },
  });
};

export const deletePost = async (api: ClientApi, postId: string) => {
  return api.delete<{ success: true }>(`/posts/${postId}`);
};

export const likePost = async (api: ClientApi, postId: string) => {
  return api.post<{ liked: boolean }>(`/posts/${postId}/like`, {});
};

export const unlikePost = async (api: ClientApi, postId: string) => {
  return api.delete<{ liked: boolean }>(`/posts/${postId}/like`);
};

export type CommentsPageResponse = {
  items: FeedComment[];
  nextCursor: string | null;
};

export const getPostComments = async (
  api: ClientApi,
  postId: string,
  cursor: string | null,
  limit: number = 20
) => {
  return api.get<CommentsPageResponse>(`/posts/${postId}/comments`, {
    params: {
      cursor: cursor ?? undefined,
      limit,
    },
  });
};

export const createPostComment = async (api: ClientApi, postId: string, content: string) => {
  return api.post<FeedComment>(`/posts/${postId}/comments`, { content });
};