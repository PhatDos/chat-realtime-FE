export type FeedFileType = "text" | "img" | "pdf";

export type FeedAuthor = {
  id: string;
  name: string;
  imageUrl: string;
};

export type FeedComment = {
  id: string;
  content: string;
  createdAt: string;
  author: FeedAuthor;
};

export type FeedPost = {
  id: string;
  content: string;
  fileUrl?: string;
  fileType: FeedFileType;
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  createdAt: string;
  likeCount: number;
  commentCount: number;
  author: FeedAuthor;
  isLiked: boolean;
  comments?: FeedComment[];
};