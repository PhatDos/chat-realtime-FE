import type { ClientApi } from "@/services/client-api";
import type {
  DirectMessage,
  MessageWithMemberWithProfile,
} from "@/types/api/message";

export type ChannelMessageSearchResponse = {
  items: MessageWithMemberWithProfile[];
};

export type DirectMessageSearchResponse = {
  items: DirectMessage[];
};

export const searchChannelMessages = async (
  api: ClientApi,
  channelId: string,
  query: string,
  limit: number = 20,
) => {
  return api.get<ChannelMessageSearchResponse>("/channel-messages/search", {
    params: {
      channelId,
      q: query,
      limit,
    },
  });
};

export const searchDirectMessages = async (
  api: ClientApi,
  conversationId: string,
  query: string,
  limit: number = 20,
) => {
  return api.get<DirectMessageSearchResponse>("/direct-message/search", {
    params: {
      conversationId,
      q: query,
      limit,
    },
  });
};
