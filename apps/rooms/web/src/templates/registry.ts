import type { TemplateId } from "@the-idea-guy/room-kit";

export interface RoomTemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  emoji: string;
  accent: string;
}

export const TEMPLATES: RoomTemplateDef[] = [
  {
    id: "choreboard",
    name: "ChoreBoard",
    description: "Family chores & allowance — kids sync, parents approve.",
    emoji: "🧹💰",
    accent: "#4f46e5",
  },
  {
    id: "tripsplit",
    name: "Trip Split",
    description: "Split trip costs with friends — who paid, who owes, settle up.",
    emoji: "✈️💸",
    accent: "#06b6d4",
  },
  {
    id: "bookclub",
    name: "Book Club",
    description: "Pick books, set meetups, queue next reads, share discussion notes.",
    emoji: "📚☕",
    accent: "#8b5cf6",
  },
  {
    id: "backlog",
    name: "Backlog",
    description: "Propose & vote on what to build next — a shared idea pool.",
    emoji: "💡🗳️",
    accent: "#f59e0b",
  },
];

export function getTemplate(id: TemplateId): RoomTemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
