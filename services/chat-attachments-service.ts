import type { ClientApi } from "@/services/client-api";
import type {
  DirectMessage,
  MessageWithMemberWithProfile,
} from "@/types/api/message";

export type ChannelAttachment = MessageWithMemberWithProfile;
export type DirectAttachment = DirectMessage;
export type ChatAttachment = ChannelAttachment | DirectAttachment;

export const getChannelMedia = (api: ClientApi, channelId: string) =>
  api.get<ChannelAttachment[]>(`/channels/${channelId}/media`);

export const getChannelFiles = (api: ClientApi, channelId: string) =>
  api.get<ChannelAttachment[]>(`/channels/${channelId}/files`);

export const getConversationMedia = (
  api: ClientApi,
  conversationId: string,
) => api.get<DirectAttachment[]>(`/conversations/${conversationId}/media`);

export const getConversationFiles = (
  api: ClientApi,
  conversationId: string,
) => api.get<DirectAttachment[]>(`/conversations/${conversationId}/files`);
