import type {
  ApiDateTime,
  MemberWithProfileResponse,
  ProfileResponse,
} from "@/types/api/member";

export type FileType = "text" | "img" | "pdf";

export interface MessageResponse {
  id: string;
  content: string;
  fileUrl: string | null;
  fileType: FileType | string;
  memberId: string;
  channelId: string;
  deleted: boolean;
  isFlagged?: boolean;
  flagReason?: string;
  createdAt: ApiDateTime;
  updatedAt: ApiDateTime;
}

export interface MessageWithMemberWithProfile extends MessageResponse {
  member: MemberWithProfileResponse | null;
}

export interface ChatMessageResponse {
  items: MessageWithMemberWithProfile[];
  nextCursor: string | null;
}

export interface ConversationResponse {
  id: string;
  profileOneId: string;
  profileTwoId: string;
}

export interface ConversationWithProfiles extends ConversationResponse {
  profileOne: ProfileResponse;
  profileTwo: ProfileResponse;
}

export interface CreateOrGetConversationResponse {
  conversation: ConversationWithProfiles;
  otherProfile: ProfileResponse;
}

export interface ConversationsListResponse {
  conversations: ConversationWithProfiles[];
}

export interface InitialConversationResponse {
  conversation: ConversationWithProfiles | null;
  otherProfile: ProfileResponse | null;
}

export interface DirectMessage {
  id: string;
  tempId?: string;
  content: string;
  fileUrl: string | null;
  fileType: FileType | string;
  senderId: string;
  conversationId: string;
  deleted: boolean;
  createdAt: ApiDateTime;
  updatedAt: ApiDateTime;
  sender: ProfileResponse;
  status?: "sending" | "sent" | "failed";
}

export interface DirectMessagePage {
  items: DirectMessage[];
}

export interface DirectMessageResponse {
  pages: DirectMessagePage[];
  pageParams?: unknown[];
}
