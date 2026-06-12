"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useSupperClubStore } from "../lib/useSupperClubStore";
import { MEMBER_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useSupperClubStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getClub()?.name ?? "Supper Club"}
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
