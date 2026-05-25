import type { ChannelResponse } from "@/types/api/channel";
import type {
  ApiDateTime,
  MemberResponse,
  MemberRole,
  MemberWithProfileResponse,
} from "@/types/api/member";

export type ServerVisibility = "PUBLIC" | "PRIVATE";

export interface ServerResponse {
  id: string;
  name: string;
  imageUrl: string;
  inviteCode: string;
  profileId: string;
  visibility: ServerVisibility;
  memberCount: number;
  generalChannelId: string | null;
  createdAt: ApiDateTime;
  updatedAt: ApiDateTime;
}

export interface InitialServerEndpointResponse {
  server: ServerResponse & {
    generalChannel?: {
      id: string;
      name: string;
    } | null;
  };
  initialChannel: import("./channel").InitialChannelResponse | null;
}

export type InitialServerResponse = InitialServerEndpointResponse | null;
export interface ServerSummary {
  id: string;
  name: string;
  imageUrl: string;
  unreadCount?: number;
}

export interface ServerDiscoverySummary {
  id: string;
  name: string;
  imageUrl: string;
  inviteCode: string;
  visibility: ServerVisibility;
  memberCount: number;
}

export interface ServerSearchResponse {
  items: ServerDiscoverySummary[];
}
export interface ServerPaginationResponse {
  data: ServerSummary[];
  total: number;
  skip: number;
  limit: number;
  totalPages: number;
}

export type ServerUnreadResponse = Record<string, number>;

export interface CurrentProfileResponse {
  id: string;
}

export interface ServerWithMembersWithProfiles extends ServerResponse {
  members: MemberWithProfileResponse[];
}

export interface ServerMeResponse {
  member: MemberResponse;
}

export interface ServerSidebarResponse {
  server: ServerResponse & {
    channels: ChannelResponse[];
    members: MemberWithProfileResponse[];
  };
  textChannels: ChannelResponse[];
  audioChannels: ChannelResponse[];
  videoChannels: ChannelResponse[];
  members: MemberWithProfileResponse[];
  role: MemberRole;
}
