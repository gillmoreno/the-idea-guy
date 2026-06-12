"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useBracketStore } from "../lib/useBracketStore";
import { PLAYER_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useBracketStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getArena()?.name ?? "Tournament Bracket"}
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
