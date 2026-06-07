import type { RoomSchema } from "./types";

const PREFIX = "rooms.pendingSchema.";

/** Stash schema between Create and first room open (owner only). */
export function stashPendingSchema(roomCode: string, schema: RoomSchema) {
  sessionStorage.setItem(PREFIX + roomCode, JSON.stringify(schema));
}

export function takePendingSchema(roomCode: string): RoomSchema | null {
  const key = PREFIX + roomCode;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  sessionStorage.removeItem(key);
  try {
    return JSON.parse(raw) as RoomSchema;
  } catch {
    return null;
  }
}

export function peekPendingSchema(roomCode: string): RoomSchema | null {
  const raw = sessionStorage.getItem(PREFIX + roomCode);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomSchema;
  } catch {
    return null;
  }
}
