export type FriendRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface ProfileLite {
  id: string;
  name: string;
  imageUrl: string;
}

export interface FriendshipInfoDto {
  id: string;
  name: string;
  imageUrl: string;
  isFriend: boolean;
}

export interface FriendRequestDto {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  sender?: ProfileLite;
  receiver?: ProfileLite;
}

export interface FriendshipDto {
  id: string;
  userOneId: string;
  userTwoId: string;
  createdAt: string;
}

export type AcceptFriendRequestResponse = [FriendshipDto, FriendRequestDto];
