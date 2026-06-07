import type {
  ContactRecord,
  DeviceVault,
  PersonaRecord,
  RoomInviteRecord,
  VaultRoom,
} from "./types";
import { CURRENT_VAULT_VERSION } from "./types";

const VAULT_KEY = "rooms.vault.v1";

function emptyVault(): DeviceVault {
  return { version: CURRENT_VAULT_VERSION, rooms: {}, contacts: {} };
}

function migrateVault(parsed: DeviceVault): DeviceVault {
  if (!parsed.rooms) return emptyVault();
  if (parsed.version === 1) {
    return {
      version: CURRENT_VAULT_VERSION,
      relayUrlOverride: parsed.relayUrlOverride,
      rooms: parsed.rooms,
      contacts: {},
      inboxCursor: {},
    };
  }
  return {
    ...parsed,
    version: CURRENT_VAULT_VERSION,
    contacts: parsed.contacts ?? {},
    inboxCursor: parsed.inboxCursor ?? {},
    roomInvites: parsed.roomInvites ?? {},
  };
}

export function loadVault(): DeviceVault {
  if (typeof window === "undefined") return emptyVault();
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return emptyVault();
    const parsed = JSON.parse(raw) as DeviceVault;
    if (parsed.version !== 1 && parsed.version !== 2) return emptyVault();
    return migrateVault(parsed);
  } catch {
    return emptyVault();
  }
}

export function saveVault(vault: DeviceVault): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

export function listVaultRooms(vault: DeviceVault): VaultRoom[] {
  return Object.values(vault.rooms).sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export function getVaultRoom(vault: DeviceVault, roomCode: string): VaultRoom | null {
  return vault.rooms[roomCode.trim()] ?? null;
}

export function upsertVaultRoom(vault: DeviceVault, room: VaultRoom): DeviceVault {
  const next = {
    ...vault,
    rooms: { ...vault.rooms, [room.roomCode]: { ...room, lastOpenedAt: Date.now() } },
  };
  saveVault(next);
  return next;
}

export function removeVaultRoom(vault: DeviceVault, roomCode: string): DeviceVault {
  const rooms = { ...vault.rooms };
  delete rooms[roomCode.trim()];
  const next = { ...vault, rooms };
  saveVault(next);
  return next;
}

export function setRelayUrlOverride(vault: DeviceVault, url: string | null): DeviceVault {
  const next = { ...vault, relayUrlOverride: url?.trim() || undefined };
  saveVault(next);
  return next;
}

export function getRelayUrl(vault: DeviceVault, defaultUrl: string): string {
  return vault.relayUrlOverride?.trim() || defaultUrl;
}

export function touchVaultRoom(vault: DeviceVault, roomCode: string): DeviceVault {
  const existing = vault.rooms[roomCode];
  if (!existing) return vault;
  return upsertVaultRoom(vault, existing);
}

export function savePersona(vault: DeviceVault, persona: PersonaRecord): DeviceVault {
  const next = { ...vault, version: CURRENT_VAULT_VERSION as 2, persona };
  saveVault(next);
  return next;
}

export function upsertContact(vault: DeviceVault, contact: ContactRecord): DeviceVault {
  const contacts = { ...(vault.contacts ?? {}), [contact.personaId]: contact };
  const next = { ...vault, version: CURRENT_VAULT_VERSION as 2, contacts };
  saveVault(next);
  return next;
}

export function getContact(vault: DeviceVault, personaId: string): ContactRecord | null {
  return vault.contacts?.[personaId] ?? null;
}

export function listContacts(vault: DeviceVault): ContactRecord[] {
  return Object.values(vault.contacts ?? {}).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function setInboxCursor(
  vault: DeviceVault,
  contactPersonaId: string,
  messageId: string,
): DeviceVault {
  const inboxCursor = { ...(vault.inboxCursor ?? {}), [contactPersonaId]: messageId };
  const next = { ...vault, inboxCursor };
  saveVault(next);
  return next;
}

export function upsertRoomInvite(vault: DeviceVault, invite: RoomInviteRecord): DeviceVault {
  const roomInvites = { ...(vault.roomInvites ?? {}), [invite.messageId]: invite };
  const next = { ...vault, roomInvites };
  saveVault(next);
  return next;
}

export function removeRoomInvite(vault: DeviceVault, messageId: string): DeviceVault {
  const roomInvites = { ...(vault.roomInvites ?? {}) };
  delete roomInvites[messageId];
  const next = { ...vault, roomInvites };
  saveVault(next);
  return next;
}

export function listPendingRoomInvites(vault: DeviceVault): RoomInviteRecord[] {
  return Object.values(vault.roomInvites ?? {})
    .filter((i) => i.status === "pending")
    .sort((a, b) => b.sentAt - a.sentAt);
}

export function getRoomInvite(vault: DeviceVault, messageId: string): RoomInviteRecord | null {
  return vault.roomInvites?.[messageId] ?? null;
}
