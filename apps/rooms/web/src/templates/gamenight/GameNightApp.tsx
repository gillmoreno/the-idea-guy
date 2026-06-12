"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { MainView } from "./components/MainView";
import { getBuiltinTemplate } from "../registry";
import { useGameNightStore } from "./lib/useGameNightStore";

const TEMPLATE = getBuiltinTemplate("gamenight");

export function GameNightApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useGameNightStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🎲"}
        accent={TEMPLATE?.accent}
        message="Starting Game Night…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🎲"}
        accent={TEMPLATE?.accent}
        message="Loading scoreboard…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="🎲🏆"
        title="Connecting to game night…"
        organizerLabel="whoever set up the room"
      />
    );
  }

  if (!currentMemberId || !store.getPlayer(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <MainView memberId={currentMemberId} />;
}
