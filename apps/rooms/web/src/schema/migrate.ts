import {
  CURRENT_ENGINE_VERSION,
  CURRENT_SCHEMA_VERSION,
  type RoomSchema,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Best-effort parse from CRDT / pasted JSON — does not validate semantics. */
export function parseRoomSchema(raw: unknown): RoomSchema | null {
  if (!isRecord(raw)) return null;
  return raw as unknown as RoomSchema;
}

/**
 * Upgrade older schemas in place. Additive changes only — never break existing rooms.
 * Bump CURRENT_SCHEMA_VERSION when a migration step is required.
 */
export function migrateRoomSchema(schema: RoomSchema | null): RoomSchema | null {
  if (!schema) return null;

  let s = { ...schema };

  if (s.schemaVersion == null || s.schemaVersion < 1) {
    s = {
      ...s,
      schemaVersion: 1,
      engineVersion: s.engineVersion ?? 1,
      collections: s.collections ?? [],
      features: s.features ?? [],
    };
  }

  if (s.engineVersion == null) {
    s.engineVersion = 1;
  }

  // Future: if (s.schemaVersion === 1) { s = migrateV1toV2(s); }

  return s;
}

export function schemaRequiresEngine(schema: RoomSchema): number {
  return schema.engineVersion ?? CURRENT_ENGINE_VERSION;
}

export function engineSupportsSchema(engineVersion: number, schema: RoomSchema): boolean {
  return engineVersion >= schemaRequiresEngine(schema);
}

export const ENGINE_VERSION = CURRENT_ENGINE_VERSION;
export const SCHEMA_VERSION = CURRENT_SCHEMA_VERSION;
