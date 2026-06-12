"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { MainView } from "./components/MainView";
import { getBuiltinTemplate } from "../registry";
import { useSitCoopStore } from "./lib/useSitCoopStore";

const TEMPLATE = getBuiltinTemplate("sitcoop");

export function SitCoopApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useSitCoopStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "👶"}
        accent={TEMPLATE?.accent}
        message="Starting Babysitting Co-op…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "👶"}
        accent={TEMPLATE?.accent}
        message="Loading the co-op…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="👶⏱️"
        title="Connecting to the co-op…"
        organizerLabel="whoever set up the co-op"
      />
    );
  }

  if (!currentMemberId || !store.getFamily(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <MainView memberId={currentMemberId} />;
}
