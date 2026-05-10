export interface UserProfileDto {
  id: string;
  name: string;
  imageUrl?: string;
  bio?: string;
  relationshipStatus?: string;
  joinDate?: string;
  location?: string;
  isOnline: boolean;
}

export interface FriendResponseDto {
  isFriend: boolean;
}

export interface PostsPageResponse {
  items: any[];
  nextCursor: string | null;
}
