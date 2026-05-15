export type ApiDateTime = Date;

export enum MemberRole {
  SERVEROWNER = "SERVEROWNER",
  VICESERVEROWNER = "VICESERVEROWNER",
  GUEST = "GUEST",
}

export interface ProfileResponse {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  email: string;
  createdAt: ApiDateTime;
  updatedAt: ApiDateTime;
}

export interface MemberResponse {
  id: string;
  role: MemberRole;
  profileId: string;
  serverId: string;
  createdAt: ApiDateTime;
  updatedAt: ApiDateTime;
}

export interface MemberWithProfileResponse extends MemberResponse {
  profile: ProfileResponse;
}
