import { deleteRoomLocalData, loadVault, removeVaultRoom } from "@the-idea-guy/room-kit";

const PENDING_SCHEMA_PREFIX = "rooms.pendingSchema.";
const MEMBER_SECRET_PREFIX = "choreboard.memberSecret.";

/** Delete all local data for a room on this device (vault entry + IndexedDB + related keys). */
export async function purgeRoomFromDevice(roomCode: string): Promise<void> {
  const trimmed = roomCode.trim();
  if (!trimmed) return;

  const vault = loadVault();
  const room = vault.rooms[trimmed];

  await deleteRoomLocalData(trimmed, true);

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(PENDING_SCHEMA_PREFIX + trimmed);
  }

  if (room?.memberId && typeof localStorage !== "undefined") {
    localStorage.removeItem(MEMBER_SECRET_PREFIX + room.memberId);
  }

  removeVaultRoom(vault, trimmed);
}
