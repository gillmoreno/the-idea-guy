import type { TemplateKind } from "@the-idea-guy/room-kit";
import { DECLARATIVE_TEMPLATE_ID } from "@the-idea-guy/room-kit";
import type { RoomSchema } from "@/schema/types";

export type BuiltinTemplateId = "choreboard" | "tripsplit" | "bookclub" | "backlog";

export interface BuiltinTemplateDef {
  kind: "builtin";
  id: BuiltinTemplateId;
  name: string;
  description: string;
  emoji: string;
  accent: string;
  /** Gil-only templates hidden from public create unless allowlisted. */
  ownerOnly?: boolean;
}

export interface CatalogTemplateDef {
  kind: "declarative";
  id: string;
  name: string;
  description: string;
  emoji: string;
  accent: string;
  schema: RoomSchema;
}

export type TemplatePick = BuiltinTemplateDef | CatalogTemplateDef;

export const BUILTIN_TEMPLATES: BuiltinTemplateDef[] = [
  {
    kind: "builtin",
    id: "choreboard",
    name: "ChoreBoard",
    description: "Family chores & allowance — kids sync, parents approve.",
    emoji: "🧹💰",
    accent: "#4f46e5",
  },
  {
    kind: "builtin",
    id: "tripsplit",
    name: "Trip Split",
    description: "Split trip costs with friends — who paid, who owes, settle up.",
    emoji: "✈️💸",
    accent: "#06b6d4",
  },
  {
    kind: "builtin",
    id: "bookclub",
    name: "Book Club",
    description: "Pick books, set meetups, queue next reads, share discussion notes.",
    emoji: "📚☕",
    accent: "#8b5cf6",
  },
  {
    kind: "builtin",
    id: "backlog",
    name: "Backlog",
    description: "Propose & vote on what to build next — a shared idea pool.",
    emoji: "💡🗳️",
    accent: "#f59e0b",
    ownerOnly: true,
  },
];

export function getBuiltinTemplate(id: string): BuiltinTemplateDef | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.id === id);
}

export function isBuiltinTemplateId(id: string): id is BuiltinTemplateId {
  return BUILTIN_TEMPLATES.some((t) => t.id === id);
}

export function canCreateBuiltin(id: BuiltinTemplateId): boolean {
  const t = getBuiltinTemplate(id);
  if (!t?.ownerOnly) return true;
  if (process.env.NODE_ENV === "development") return true;
  const allow = process.env.NEXT_PUBLIC_ROOMS_OWNER_ALLOWLIST ?? "";
  return allow.trim().length > 0;
}

export function templateKindForPick(pick: TemplatePick): TemplateKind {
  return pick.kind === "declarative" ? "declarative" : "builtin";
}

export function templateIdForPick(pick: TemplatePick): string {
  return pick.kind === "declarative" ? DECLARATIVE_TEMPLATE_ID : pick.id;
}

/** @deprecated use getBuiltinTemplate */
export function getTemplate(id: string): BuiltinTemplateDef | undefined {
  return getBuiltinTemplate(id);
}

/** @deprecated use BUILTIN_TEMPLATES */
export const TEMPLATES = BUILTIN_TEMPLATES;
