import type { FeedComment, FeedPost } from "@/components/newsfeed/types";

export const POSTS_EVENTS_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/posts/events`;

export const buildBearerHeaders = (token: string | null | undefined) => {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
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