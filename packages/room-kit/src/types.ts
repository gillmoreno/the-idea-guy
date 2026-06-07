export type TemplateId = "choreboard" | string;

export type MemberRole = "owner" | "admin" | "member";

export interface PublicRoomMeta {
  roomName: string;
  templateId: TemplateId;
  createdAt: number;
}

export interface AdminRoomMeta extends PublicRoomMeta {
  ownerId: string;
  adminSecretVersion: number;
}

export interface PublicMemberRecord {
  id: string;
  displayName: string;
  color: string;
  joinedAt: number;
  roleHint?: MemberRole;
}

export interface AdminMemberRecord {
  id: string;
  displayName: string;
  role: MemberRole;
  color: string;
  joinedAt: number;
  grantedBy?: string;
  grantedAt?: number;
}

export interface VaultRoom {
  roomCode: string;
  templateId: TemplateId;
  roomName?: string;
  memberId: string;
  displayName?: string;
  adminSecret?: string;
  isOwner?: boolean;
  lastOpenedAt: number;
}

export interface DeviceVault {
  version: 1;
  relayUrlOverride?: string;
  rooms: Record<string, VaultRoom>;
}
