import { Y } from "@the-idea-guy/room-kit";
import type { TemplateId, TemplateKind } from "@the-idea-guy/room-kit";
import { DECLARATIVE_TEMPLATE_ID } from "@the-idea-guy/room-kit";
import type { RoomSchema } from "@/schema/types";
import { migrateRoomSchema, parseRoomSchema } from "@/schema/migrate";

export interface ResolvedRoomMeta {
  roomName: string | null;
  templateKind: TemplateKind;
  templateId: TemplateId;
  schema: RoomSchema | null;
  createdAt: number | null;
  initialized: boolean;
  /** Set when an admin deleted the room — tombstone replicates to every member. */
  deletedAt: number | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Read-only — safe during React render. */
export function readRoomMeta(doc: Y.Doc): ResolvedRoomMeta {
  const meta = doc.getMap("meta");
  const roomName = meta.get("roomName");
  const templateId = meta.get("templateId");
  const templateKindRaw = meta.get("templateKind");
  const createdAt = meta.get("createdAt");
  const schemaRaw = meta.get("schema");
  const deletedAt = meta.get("deletedAt");

  const kind: TemplateKind =
    templateKindRaw === "declarative" || templateKindRaw === "builtin"
      ? templateKindRaw
      : typeof templateId === "string" && templateId === DECLARATIVE_TEMPLATE_ID
        ? "declarative"
        : "builtin";

  const id = typeof templateId === "string" ? templateId : "";
  const schema =
    kind === "declarative" && isRecord(schemaRaw)
      ? migrateRoomSchema(parseRoomSchema(schemaRaw))
      : null;

  const initialized =
    kind === "declarative"
      ? schema != null && typeof createdAt === "number"
      : typeof createdAt === "number" && id.length > 0;

  return {
    roomName: typeof roomName === "string" ? roomName : null,
    templateKind: kind,
    templateId: id,
    schema,
    createdAt: typeof createdAt === "number" ? createdAt : null,
    initialized,
    deletedAt: typeof deletedAt === "number" ? deletedAt : null,
  };
}

/** Tombstone the room for every member. Call inside `doc.transact()` only. */
export function markRoomDeleted(doc: Y.Doc) {
  doc.getMap("meta").set("deletedAt", Date.now());
}

export interface WriteRoomMetaInput {
  templateKind: TemplateKind;
  templateId: TemplateId;
  roomName: string;
  schema?: RoomSchema | null;
}

/** Call inside `doc.transact()` only. */
export function writeRoomMeta(doc: Y.Doc, input: WriteRoomMetaInput) {
  const meta = doc.getMap("meta");
  const stamp = Date.now();
  meta.set("templateKind", input.templateKind);
  meta.set("templateId", input.templateId);
  meta.set("roomName", input.roomName.trim());
  if (meta.get("createdAt") == null) meta.set("createdAt", stamp);
  if (input.templateKind === "declarative" && input.schema) {
    meta.set("schema", input.schema);
  }
}
