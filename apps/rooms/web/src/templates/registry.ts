import type { TemplateId } from "@the-idea-guy/room-kit";

export interface RoomTemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  emoji: string;
}

export const TEMPLATES: RoomTemplateDef[] = [
  {
    id: "choreboard",
    name: "ChoreBoard",
    description: "Family chores & allowance — kids sync, parents approve.",
    emoji: "🧹💰",
  },
];

export function getTemplate(id: TemplateId): RoomTemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
