import type { ContactRecord } from "@the-idea-guy/room-kit";
import {
  SETUP_MEMBER_COLORS,
  buildInviteeSlots,
  type InviteeSlot,
} from "./roomMemberInvites";

export async function sendPostSetupRoomInvites(params: {
  invited: ContactRecord[];
  roomCode: string;
  roomName: string;
  templateId: string;
  colors?: readonly string[];
  onReserveMembers: (slots: InviteeSlot[]) => void;
  sendRoomInvites: (input: {
    roomCode: string;
    roomName: string;
    templateId: string;
    invites: { contact: ContactRecord; memberSlotId: string }[];
  }) => Promise<void>;
}): Promise<number> {
  const slots = buildInviteeSlots(params.invited, params.colors ?? SETUP_MEMBER_COLORS);
  if (slots.length === 0) return 0;
  params.onReserveMembers(slots);
  await params.sendRoomInvites({
    roomCode: params.roomCode,
    roomName: params.roomName,
    templateId: params.templateId,
    invites: slots.map((s) => ({ contact: s.contact, memberSlotId: s.slotId })),
  });
  return slots.length;
}
