import { Y, isYMap } from "@the-idea-guy/room-kit";
import {
  DECLARATIVE_TEMPLATE_ID,
  PENDING_TEMPLATE_ID,
  type TemplateId,
  type TemplateKind,
  type VaultRoom,
} from "@the-idea-guy/room-kit";
import { readRoomMeta, type ResolvedRoomMeta } from "./roomMeta";
import type { BuiltinTemplateId } from "@/templates/registry";
import { isBuiltinTemplateId } from "@/templates/registry";

const BRANCH_INIT_KEYS: Record<string, string> = {
  choreboard: "family",
  tripsplit: "trip",
  bookclub: "club",
  backlog: "board",
  [DECLARATIVE_TEMPLATE_ID]: "board",
};

function branchLooksInitialized(branch: Y.Map<unknown>, templateId: string): boolean {
  const nestedKey = BRANCH_INIT_KEYS[templateId];
  if (!nestedKey) return false;
  const nested = branch.get(nestedKey);
  if (!isYMap(nested)) return false;
  if (templateId === "choreboard") return nested.get("createdAt") != null;
  return typeof nested.get("name") === "string";
}

/** Guess template from `template.*` branches when meta was never written (legacy rooms). */
export function inferTemplateFromDoc(doc: Y.Doc): TemplateId | null {
  const meta = readRoomMeta(doc);
  if (meta.schema) return DECLARATIVE_TEMPLATE_ID;

  const root = doc.getMap("template");
  const hits: TemplateId[] = [];
  for (const key of root.keys()) {
    const branch = root.get(key);
    if (isYMap(branch) && branchLooksInitialized(branch as Y.Map<unknown>, key)) {
      hits.push(key);
    }
  }
  if (hits.length === 1) return hits[0];
  return null;
}

export interface ResolvedRoomType {
  templateKind: TemplateKind;
  templateId: TemplateId;
  source: "doc" | "vault" | "inferred" | "pending";
  isPending: boolean;
}

function pickId(...candidates: (string | null | undefined)[]): TemplateId | null {
  for (const c of candidates) {
    if (c && c !== PENDING_TEMPLATE_ID) return c;
  }
  return null;
}

export function resolveRoomType(input: {
  roomMeta: ResolvedRoomMeta | null;
  vaultRoom: VaultRoom | null;
  vaultTemplateId: TemplateId | null;
  vaultTemplateKind: TemplateKind | null;
  inferredId: TemplateId | null;
}): ResolvedRoomType {
  const docId = input.roomMeta?.templateId || null;
  const docKind = input.roomMeta?.templateKind ?? null;

  const vaultId = input.vaultRoom?.templateId ?? input.vaultTemplateId;
  const vaultKind = input.vaultRoom?.templateKind ?? input.vaultTemplateKind;

  const id =
    pickId(docId, vaultId, input.inferredId) ??
    (docId === PENDING_TEMPLATE_ID || vaultId === PENDING_TEMPLATE_ID
      ? PENDING_TEMPLATE_ID
      : docId || vaultId || input.inferredId || PENDING_TEMPLATE_ID);

  const isPending = !id || id === PENDING_TEMPLATE_ID;

  let templateKind: TemplateKind = "builtin";
  if (docKind && docId) templateKind = docKind;
  else if (vaultKind && vaultId && vaultId !== PENDING_TEMPLATE_ID) templateKind = vaultKind;
  else if (id === DECLARATIVE_TEMPLATE_ID || input.roomMeta?.schema) templateKind = "declarative";
  else if (id && isBuiltinTemplateId(id as BuiltinTemplateId)) templateKind = "builtin";

  let source: ResolvedRoomType["source"] = "pending";
  if (!isPending) {
    if (docId && docId !== PENDING_TEMPLATE_ID) source = "doc";
    else if (vaultId && vaultId !== PENDING_TEMPLATE_ID) source = "vault";
    else source = "inferred";
  }

  return { templateKind, templateId: id, source, isPending };
}
