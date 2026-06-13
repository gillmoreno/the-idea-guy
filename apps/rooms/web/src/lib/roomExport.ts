/**
 * roomExport — turn a room's CRDT state into portable files.
 *
 * Generic over *any* room (builtin or declarative): it serializes the Yjs
 * document branches to plain objects via `.toJSON()`, with no template-specific
 * knowledge. JSON is the lossless backup; CSV is a best-effort flatten of the
 * record-like collections for spreadsheet apps (Excel/Sheets).
 *
 * Export only — there is intentionally no import/recreate path yet (the data
 * safety net that must exist before any built-in template is deleted; see
 * docs_and_changelog/SCHEMA_CONVERGENCE.md item E0).
 */
import { Y } from "@the-idea-guy/room-kit";

export interface RoomExportSnapshot {
  exportedAt: string;
  room: {
    code: string | null;
    name: string | null;
    templateId: string | null;
    templateKind: string | null;
  };
  /** publicDoc "meta" map (room name, template id, schema, timestamps). */
  meta: Record<string, unknown>;
  /** publicDoc "template" map — all the room's actual data. */
  template: Record<string, unknown>;
  /** adminDoc "template" map, present only when the caller has admin access. */
  admin?: Record<string, unknown>;
}

function safeJson(doc: Y.Doc, key: string): Record<string, unknown> {
  try {
    return doc.getMap(key).toJSON() as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Build a complete, plain-object snapshot of a room from its Yjs docs. */
export function buildRoomSnapshot(args: {
  publicDoc: Y.Doc;
  adminDoc: Y.Doc | null;
  room: RoomExportSnapshot["room"];
}): RoomExportSnapshot {
  const { publicDoc, adminDoc, room } = args;
  const snapshot: RoomExportSnapshot = {
    exportedAt: new Date().toISOString(),
    room,
    meta: safeJson(publicDoc, "meta"),
    template: safeJson(publicDoc, "template"),
  };
  if (adminDoc) {
    const admin = safeJson(adminDoc, "template");
    if (Object.keys(admin).length > 0) snapshot.admin = admin;
  }
  return snapshot;
}

// --- CSV flatten -----------------------------------------------------------

type Row = Record<string, string>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPrimitive(v: unknown): boolean {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

/** A "record" = an object that carries at least one primitive field. */
function isRecordLike(v: unknown): v is Record<string, unknown> {
  return isPlainObject(v) && Object.values(v).some(isPrimitive);
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) {
    return v.map((x) => (isPrimitive(x) ? String(x) : JSON.stringify(x))).join("; ");
  }
  if (isPlainObject(v)) return JSON.stringify(v);
  return String(v);
}

function rowFrom(collection: string, id: string, rec: Record<string, unknown>): Row {
  const row: Row = { collection, id };
  for (const [k, v] of Object.entries(rec)) {
    // Don't let a field literally named collection/id clobber our columns.
    row[k === "collection" || k === "id" ? `field_${k}` : k] = cell(v);
  }
  return row;
}

/** Walk the tree; every record-like leaf becomes a row tagged with its path. */
function collect(node: unknown, path: string, rows: Row[]): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      if (isRecordLike(item)) rows.push(rowFrom(path || "room", String(i), item));
      else if (isPlainObject(item) || Array.isArray(item)) collect(item, path, rows);
    });
    return;
  }
  if (!isPlainObject(node)) return;
  for (const [key, value] of Object.entries(node)) {
    const childPath = path ? `${path}.${key}` : key;
    if (isRecordLike(value)) rows.push(rowFrom(path || "room", key, value));
    else if (isPlainObject(value) || Array.isArray(value)) collect(value, childPath, rows);
  }
}

function csvEscape(s: string): string {
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Flatten the "template" branch of a snapshot into a single CSV. Each record
 * across every collection becomes a row, tagged with its `collection` path and
 * `id`; columns are the union of all fields seen. Returns "" when there are no
 * records (caller substitutes a friendly placeholder).
 */
export function snapshotToCsv(template: Record<string, unknown>): string {
  const rows: Row[] = [];
  collect(template, "", rows);
  if (rows.length === 0) return "";

  const cols = new Set<string>(["collection", "id"]);
  for (const r of rows) for (const k of Object.keys(r)) cols.add(k);
  const header = Array.from(cols);

  const lines = [header.map(csvEscape).join(",")];
  for (const r of rows) lines.push(header.map((c) => csvEscape(r[c] ?? "")).join(","));
  return lines.join("\r\n") + "\r\n";
}
