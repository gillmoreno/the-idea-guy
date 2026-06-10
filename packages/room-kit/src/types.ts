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
  /** Yjs state-vector hash after last room open (baseline for update badges). */
  lastSeenStateHash?: string;
  /** Last successful background pull from the relay on home. */
  lastBackgroundSyncedAt?: number;
  /** Remote changes since lastSeenStateHash — cleared when the room is opened. */
  hasRemoteUpdates?: boolean;
  /** Optional second secret — shared out-of-band, never in invite URLs. */
  roomPassphrase?: string;
  /** Room requires passphrase for key derivation (invite link alone is insufficient). */
  passphraseProtected?: boolean;
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

export type RoomInviteStatus = "pending" | "declined";

export interface RoomInviteRecord {
  messageId: string;
  roomCode: string;
  roomName: string;
  templateId: string;
  memberSlotId: string;
  /** Invitee persona public key — only they may accept. */
  memberBinding: string;
  fromPersonaId: string;
  fromName: string;
  fromAvatar?: string;
  status: RoomInviteStatus;
  sentAt: number;
}

export interface DeviceVault {
  version: 1 | 2;
  relayUrlOverride?: string;
  /** Pull room updates when the home screen is open (default on). */
  backgroundRoomSync?: boolean;
  persona?: PersonaRecord;
  contacts?: Record<string, ContactRecord>;
  inboxCursor?: InboxCursor;
  roomInvites?: Record<string, RoomInviteRecord>;
  rooms: Record<string, VaultRoom>;
}

export const CURRENT_VAULT_VERSION = 2;
