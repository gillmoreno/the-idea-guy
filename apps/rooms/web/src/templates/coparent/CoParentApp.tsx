"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { MainView } from "./components/MainView";
import { getBuiltinTemplate } from "../registry";
import { useCoParentStore } from "./lib/useCoParentStore";

const TEMPLATE = getBuiltinTemplate("coparent");

export function CoParentApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useCoParentStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "👨‍👩‍👧"}
        accent={TEMPLATE?.accent}
        message="Starting Co-Parenting Hub…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "👨‍👩‍👧"}
        accent={TEMPLATE?.accent}
        message="Loading the hub…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="👨‍👩‍👧🗓️"
        title="Connecting to the hub…"
        organizerLabel="the other parent"
      />
    );
  }

  if (!currentMemberId || !store.getParent(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <MainView memberId={currentMemberId} />;
}
