export type TemplateId = string;

/** `declarative` = JSON schema room; anything else = built-in compiled template. */
export type TemplateKind = "builtin" | "declarative";

export const DECLARATIVE_TEMPLATE_ID = "declarative";

/** Vault placeholder until the CRDT doc reveals the real template. */
export const PENDING_TEMPLATE_ID = "_pending";

export type MemberRole = "owner" | "admin" | "member";

export interface PublicRoomMeta {
  roomName: string;
  templateKind: TemplateKind;
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
  templateKind?: TemplateKind;
  templateId: TemplateId;
  roomName?: string;
  memberId: string;
  displayName?: string;
  adminSecret?: string;
  isOwner?: boolean;
  lastOpenedAt: number;
}

export type ContactStatus = "pending_out" | "pending_in" | "mutual" | "blocked";

export interface PersonaRecord {
  personaId: string;
  publicKey: string;
  privateKeyJwk: JsonWebKey;
  displayName: string;
  color: string;
  /** Serialized avatar brick JSON (emoji or compressed image). */
  avatar?: string;
  createdAt: number;
}

export interface ContactRecord {
  personaId: string;
  publicKey: string;
  displayName: string;
  status: ContactStatus;
  avatar?: string;
  updatedAt: number;
}

/** Last processed inbox message id per contact persona. */
export type InboxCursor = Record<string, string>;

export interface DeviceVault {
  version: 1 | 2;
  relayUrlOverride?: string;
  persona?: PersonaRecord;
  contacts?: Record<string, ContactRecord>;
  inboxCursor?: InboxCursor;
  rooms: Record<string, VaultRoom>;
}

export const CURRENT_VAULT_VERSION = 2;
