import { deriveKey, deriveRoom } from "./crypto";
import { importContactPublicKey, importPersonaPrivateKey } from "./persona";

const INBOX_APP_ID = "rooms-inbox";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Stable pair id — both peers derive the same relay room. */
export function pairRoomCode(publicKeyA: string, publicKeyB: string): string {
  return [publicKeyA, publicKeyB].sort().join("|");
}

export async function derivePairInboxKeyMaterial(
  myPrivateKeyJwk: JsonWebKey,
  theirPublicKey: string,
): Promise<string> {
  const priv = await importPersonaPrivateKey(myPrivateKeyJwk);
  const pub = await importContactPublicKey(theirPublicKey);
  const bits = await crypto.subtle.deriveBits(
    { name: "X25519", public: pub },
    priv,
    256,
  );
  return "lfk-inbox:" + toHex(new Uint8Array(bits));
}

export async function derivePairInboxRelayRoom(
  publicKeyA: string,
  publicKeyB: string,
): Promise<string> {
  return deriveRoom(pairRoomCode(publicKeyA, publicKeyB), INBOX_APP_ID, "public");
}

export async function derivePairInboxAesKey(keyMaterial: string) {
  return deriveKey(keyMaterial);
}

export type InboxMessageType = "friend_request" | "friend_accept" | "room_invite";

export interface InboxMessageBase {
  id: string;
  type: InboxMessageType;
  fromPersonaId: string;
  fromName: string;
  /** Serialized avatar brick JSON */
  fromAvatar?: string;
  sentAt: number;
}

export interface FriendRequestMessage extends InboxMessageBase {
  type: "friend_request";
}

export interface FriendAcceptMessage extends InboxMessageBase {
  type: "friend_accept";
}

export interface RoomInviteMessage extends InboxMessageBase {
  type: "room_invite";
  roomCode: string;
  roomName: string;
  templateId: string;
  memberSlotId: string;
  memberBinding: string;
}

export type InboxMessage =
  | FriendRequestMessage
  | FriendAcceptMessage
  | RoomInviteMessage;

export function parseInboxMessage(raw: string): InboxMessage | null {
  try {
    const o = JSON.parse(raw) as InboxMessage;
    if (!o?.id || !o.type || !o.fromPersonaId) return null;
    if (o.type === "friend_request" || o.type === "friend_accept") return o;
    if (
      o.type === "room_invite" &&
      typeof (o as RoomInviteMessage).roomCode === "string" &&
      typeof (o as RoomInviteMessage).memberBinding === "string"
    ) {
      return o as RoomInviteMessage;
    }
  } catch {
    return null;
  }
  return null;
}

export function newFriendRequest(
  fromPersonaId: string,
  fromName: string,
  fromAvatar?: string,
): FriendRequestMessage {
  return {
    id: "msg_" + crypto.randomUUID(),
    type: "friend_request",
    fromPersonaId,
    fromName,
    fromAvatar,
    sentAt: Date.now(),
  };
}

export function newFriendAccept(
  fromPersonaId: string,
  fromName: string,
  fromAvatar?: string,
): FriendAcceptMessage {
  return {
    id: "msg_" + crypto.randomUUID(),
    type: "friend_accept",
    fromPersonaId,
    fromName,
    fromAvatar,
    sentAt: Date.now(),
  };
}

export function newRoomInvite(input: {
  fromPersonaId: string;
  fromName: string;
  fromAvatar?: string;
  roomCode: string;
  roomName: string;
  templateId: string;
  memberSlotId: string;
  /** Invitee persona public key. */
  memberBinding: string;
}): RoomInviteMessage {
  return {
    id: "msg_" + crypto.randomUUID(),
    type: "room_invite",
    fromPersonaId: input.fromPersonaId,
    fromName: input.fromName,
    fromAvatar: input.fromAvatar,
    sentAt: Date.now(),
    roomCode: input.roomCode.trim(),
    roomName: input.roomName.trim(),
    templateId: input.templateId,
    memberSlotId: input.memberSlotId,
    memberBinding: input.memberBinding,
  };
}

/** True when this device persona may accept the invite. */
export function canAcceptRoomInvite(
  invite: Pick<RoomInviteMessage, "memberBinding">,
  myPublicKey: string,
): boolean {
  return invite.memberBinding === myPublicKey;
}
