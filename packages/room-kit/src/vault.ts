import type { DeviceVault, VaultRoom } from "./types";

const VAULT_KEY = "rooms.vault.v1";

function emptyVault(): DeviceVault {
  return { version: 1, rooms: {} };
}

export function loadVault(): DeviceVault {
  if (typeof window === "undefined") return emptyVault();
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return emptyVault();
    const parsed = JSON.parse(raw) as DeviceVault;
    if (parsed.version !== 1 || !parsed.rooms) return emptyVault();
    return parsed;
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
