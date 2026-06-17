import type { FeedComment, FeedPost } from "@/components/newsfeed/types";

export const POSTS_EVENTS_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/posts/events`;
export const FRIEND_REQUESTS_EVENTS_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/friend-requests/events`;

export const buildBearerHeaders = (token: string | null | undefined) => {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const getJwtExpirationMs = (token: string | null | undefined) => {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(atob(normalizedPayload));

    return typeof parsed.exp === "number" ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isJwtExpired = (
  token: string | null | undefined,
  leewayMs = 30_000
) => {
  const expiresAt = getJwtExpirationMs(token);

  return expiresAt !== null && expiresAt <= Date.now() + leewayMs;
};

export type PostCreatedPayload = {
  type: "POST_CREATED";
  actionUserId?: string;
  post: FeedPost;
};

export type PostLikedPayload = {
  type: "POST_LIKED";
  actionUserId?: string;
  postId: string;
  likeCount: number;
};

export type PostUnlikedPayload = {
  type: "POST_UNLIKED";
  actionUserId?: string;
  postId: string;
  likeCount: number;
};

export type CommentAddedPayload = {
  type: "COMMENT_ADDED";
  actionUserId?: string;
  postId: string;
  comment: FeedComment;
};

export type PostsEventPayload =
  | PostCreatedPayload
  | PostLikedPayload
  | PostUnlikedPayload
  | CommentAddedPayload;
