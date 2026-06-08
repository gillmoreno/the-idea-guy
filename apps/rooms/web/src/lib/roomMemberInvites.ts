import {
  type ContactRecord,
  type PersonaRecord,
  generateMemberId,
} from "@the-idea-guy/room-kit";

/** Shared member colors for setup invite flows. */
export const SETUP_MEMBER_COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#64748b",
] as const;

export function pickSetupMemberColor(index: number, colors: readonly string[] = SETUP_MEMBER_COLORS) {
  return colors[index % colors.length];
}

export function buildOrganizerMember(params: {
  persona: PersonaRecord;
  currentMemberId?: string | null;
  color?: string;
}) {
  return {
    id: params.currentMemberId ?? generateMemberId(),
    name: params.persona.displayName,
    color: params.color ?? pickSetupMemberColor(0),
  };
}

export function buildInviteeSlots(
  contacts: ContactRecord[],
  colors: readonly string[] = SETUP_MEMBER_COLORS,
) {
  return contacts.map((contact, i) => ({
    contact,
    slotId: generateMemberId(),
    name: contact.displayName,
    color: pickSetupMemberColor(i + 1, colors),
  }));
}

export type InviteeSlot = ReturnType<typeof buildInviteeSlots>[number];
