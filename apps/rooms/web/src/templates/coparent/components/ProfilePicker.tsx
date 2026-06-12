"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { PARENT_COLORS } from "../lib/types";
import { useCoParentStore } from "../lib/useCoParentStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useCoParentStore();
  if (!store) return null;

  const hub = store.getHub();
  return (
    <ClaimProfile
      title={hub ? `${hub.kidsLabel} · co-parenting` : "Co-Parenting Hub"}
      personLabel="parent"
      people={store.listParents()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: PARENT_COLORS,
        onAdd: (p) => store.addParent({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
