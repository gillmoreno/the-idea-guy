"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { MainView } from "./components/MainView";
import { getBuiltinTemplate } from "../registry";
import { useCarLogStore } from "./lib/useCarLogStore";

const TEMPLATE = getBuiltinTemplate("carlog");

export function CarLogApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useCarLogStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🚙"}
        accent={TEMPLATE?.accent}
        message="Starting Shared Car Log…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🚙"}
        accent={TEMPLATE?.accent}
        message="Loading car log…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="🚙🔑"
        title="Connecting to the car log…"
        organizerLabel="whoever set up the room"
      />
    );
  }

  if (!currentMemberId || !store.getDriver(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <MainView memberId={currentMemberId} />;
}
