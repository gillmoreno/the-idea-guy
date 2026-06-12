"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { MEMBER_COLORS } from "../lib/types";
import { useBookClubStore } from "../lib/useBookClubStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useBookClubStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getClub()?.name ?? "Book Club"}
      personLabel="member"
      people={store.listMembers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: MEMBER_COLORS,
        onAdd: (p) => store.addMember({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
