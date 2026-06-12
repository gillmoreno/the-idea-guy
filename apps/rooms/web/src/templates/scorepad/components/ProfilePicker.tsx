"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useScorePadStore } from "../lib/useScorePadStore";
import { PLAYER_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useScorePadStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getPad()?.name ?? "Score Pad"}
      personLabel="player"
      people={store.listPlayers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: PLAYER_COLORS,
        onAdd: (p) => store.addPlayer({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
