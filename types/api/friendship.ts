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
  pendingRequest?: {
    id: string;
    direction: "sent" | "received";
  } | null;
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

// List response item shape (enriched to match SSE/list contract)
export interface FriendRequestListItemDto {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  // actorProfile is the profile of the actor relevant for the list:
  // - for incoming list: the sender
  // - for sent list: the receiver
  actorProfile?: ProfileLite;
}

export interface FriendshipDto {
  id: string;
  userOneId: string;
  userTwoId: string;
  createdAt: string;
}

export type AcceptFriendRequestResponse = [FriendshipDto, FriendRequestDto];
