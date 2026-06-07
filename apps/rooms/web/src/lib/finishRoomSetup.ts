import type { ContactRecord, PersonaRecord } from "@the-idea-guy/room-kit";
import {
  SETUP_MEMBER_COLORS,
  buildInviteeSlots,
  buildOrganizerMember,
} from "./roomMemberInvites";

export async function finishRoomSetupWithInvites(params: {
  roomCode: string;
  roomName: string;
  templateId: string;
  persona: PersonaRecord;
  currentMemberId?: string | null;
  invited: ContactRecord[];
  colors?: readonly string[];
  setCurrentMember: (id: string) => void;
  sendRoomInvites: (input: {
    roomCode: string;
    roomName: string;
    templateId: string;
    invites: { contact: ContactRecord; memberSlotId: string }[];
  }) => Promise<void>;
  addOrganizer: (member: { id: string; name: string; color: string }) => void;
  addInvitee: (member: { id: string; name: string; color: string }) => void;
  /** Called with organizer slot before members are written (e.g. initBoard). */
  onOrganizerReady?: (organizer: { id: string; name: string; color: string }) => void | Promise<void>;
}) {
  const colors = params.colors ?? SETUP_MEMBER_COLORS;
  const organizer = buildOrganizerMember({
    persona: params.persona,
    currentMemberId: params.currentMemberId,
    color: colors[0],
  });
  await params.onOrganizerReady?.(organizer);
  params.addOrganizer(organizer);
  params.setCurrentMember(organizer.id);

  const slots = buildInviteeSlots(params.invited, colors);
  for (const slot of slots) {
    params.addInvitee({ id: slot.slotId, name: slot.name, color: slot.color });
  }

  if (slots.length > 0) {
    await params.sendRoomInvites({
      roomCode: params.roomCode,
      roomName: params.roomName,
      templateId: params.templateId,
      invites: slots.map((s) => ({ contact: s.contact, memberSlotId: s.slotId })),
    });
  }
}
