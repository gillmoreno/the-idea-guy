"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useGroupFundStore } from "../lib/useGroupFundStore";
import { SAVER_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useGroupFundStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getFund()?.name ?? "Group Fund"}
      personLabel="saver"
      people={store.listSavers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: SAVER_COLORS,
        onAdd: (p) => store.addSaver({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
