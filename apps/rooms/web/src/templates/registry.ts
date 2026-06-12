import type { TemplateKind } from "@the-idea-guy/room-kit";
import { DECLARATIVE_TEMPLATE_ID } from "@the-idea-guy/room-kit";
import type { RoomSchema } from "@/schema/types";

export type BuiltinTemplateId =
  | "choreboard"
  | "tripsplit"
  | "bookclub"
  | "backlog"
  | "fitcrew"
  | "roomledger"
  | "whosin"
  | "doselog"
  | "carpool"
  | "gamenight"
  | "carecircle"
  | "cabincal"
  | "bracket"
  | "carlog"
  | "coparent"
  | "groupfund"
  | "sitcoop"
  | "supperclub"
  | "symptomdiary"
  | "scorepad";

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
  {
    kind: "builtin",
    id: "roomledger",
    name: "Roommate Ledger",
    description: "Household bills & shared purchases — who paid, who owes, settle up.",
    emoji: "🏠💸",
    accent: "#0d9488",
  },
  {
    kind: "builtin",
    id: "whosin",
    name: "Who's In?",
    description: "Recurring event headcount — RSVP per date, capacity, waitlist.",
    emoji: "🙋📅",
    accent: "#0284c7",
  },
  {
    kind: "builtin",
    id: "doselog",
    name: "Dose Log",
    description: "Shared medication log — who gave what, when. No double doses.",
    emoji: "💊🕐",
    accent: "#dc2626",
  },
  {
    kind: "builtin",
    id: "carpool",
    name: "Carpool Rota",
    description: "Whose turn to drive — log drives, fairness counter, swaps sort themselves.",
    emoji: "🚗🔁",
    accent: "#2563eb",
  },
  {
    kind: "builtin",
    id: "gamenight",
    name: "Game Night",
    description: "Running scoreboard across game nights — wins, streaks, who hosts next.",
    emoji: "🎲🏆",
    accent: "#9333ea",
  },
  {
    kind: "builtin",
    id: "carecircle",
    name: "Care Circle",
    description: "Family caring for someone — visits, who's up next, doctor updates.",
    emoji: "❤️🏥",
    accent: "#e11d48",
  },
  {
    kind: "builtin",
    id: "cabincal",
    name: "Cabin Calendar",
    description: "Shared cabin, boat, or caravan — claim dates, no clashes, fair nights.",
    emoji: "🏔️🗓️",
    accent: "#0e7490",
  },
  {
    kind: "builtin",
    id: "bracket",
    name: "Tournament Bracket",
    description: "Knockout night — seed a bracket, tap winners, crown a champion.",
    emoji: "🏆🎮",
    accent: "#ca8a04",
  },
  {
    kind: "builtin",
    id: "carlog",
    name: "Shared Car Log",
    description: "One shared car — who has it, fill-ups, odometer, service history.",
    emoji: "🚙🔑",
    accent: "#475569",
  },
  {
    kind: "builtin",
    id: "coparent",
    name: "Co-Parenting Hub",
    description: "Two households, one calm place — schedule, updates, and the kid-expenses ledger.",
    emoji: "👨‍👩‍👧🗓️",
    accent: "#0369a1",
  },
  {
    kind: "builtin",
    id: "groupfund",
    name: "Group Fund",
    description: "Save toward something together — chip in, watch the bar fill up.",
    emoji: "💰🎯",
    accent: "#15803d",
  },
  {
    kind: "builtin",
    id: "sitcoop",
    name: "Babysitting Co-op",
    description: "Trade sitting hours with other families — earn by sitting, spend going out.",
    emoji: "👶⏱️",
    accent: "#be185d",
  },
  {
    kind: "builtin",
    id: "supperclub",
    name: "Supper Club",
    description: "Rotating dinner parties — fair hosting, theme votes, dinner history.",
    emoji: "🍷🍽️",
    accent: "#9f1239",
  },
  {
    kind: "builtin",
    id: "symptomdiary",
    name: "Symptom Diary",
    description: "The record the doctor asks for — symptoms, severity, who noticed what.",
    emoji: "🩺📓",
    accent: "#0f766e",
  },
  {
    kind: "builtin",
    id: "scorepad",
    name: "Score Pad",
    description: "The games table's score sheet — one phone scores everyone, round by round.",
    emoji: "🃏✏️",
    accent: "#7c2d12",
  },
  {
    kind: "builtin",
    id: "fitcrew",
    name: "Fit Crew",
    description: "Friend workout league — log sessions, streaks, weekly board, silly prizes.",
    emoji: "🏃🔥",
    accent: "#ef4444",
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
