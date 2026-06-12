"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useRoomLedgerStore } from "../lib/useRoomLedgerStore";
import { ROOMMATE_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useRoomLedgerStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getHouse()?.name ?? "Roommate Ledger"}
      personLabel="roommate"
      people={store.listRoommates()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: ROOMMATE_COLORS,
        onAdd: (p) => store.addRoommate({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
