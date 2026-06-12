"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { MainView } from "./components/MainView";
import { getBuiltinTemplate } from "../registry";
import { useCarpoolStore } from "./lib/useCarpoolStore";

const TEMPLATE = getBuiltinTemplate("carpool");

export function CarpoolApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useCarpoolStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🚗"}
        accent={TEMPLATE?.accent}
        message="Starting Carpool Rota…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🚗"}
        accent={TEMPLATE?.accent}
        message="Loading rota…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="🚗🔁"
        title="Connecting to your rota…"
        organizerLabel="whoever set up the rota"
      />
    );
  }

  if (!currentMemberId || !store.getDriver(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <MainView memberId={currentMemberId} />;
}
