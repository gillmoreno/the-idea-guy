"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "@/templates/choreboard/components/Setup";
import { ProfilePicker } from "@/templates/choreboard/components/ProfilePicker";
import { KidView } from "@/templates/choreboard/components/KidView";
import { ParentView } from "@/templates/choreboard/components/ParentView";
import { ParentGate } from "@/templates/choreboard/components/ParentGate";
import { useChoreStore } from "@/templates/choreboard/lib/useChoreStore";
import { getBuiltinTemplate } from "@/templates/registry";

const TEMPLATE = getBuiltinTemplate("choreboard");

export function ChoreBoardApp() {
  const {
    mounted,
    roomCode,
    hasAdminAccess,
    isOwner,
    sync,
    currentMemberId,
    version,
  } = useRoomSession();
  const store = useChoreStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🧹"}
        accent={TEMPLATE?.accent}
        message="Starting ChoreBoard…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded) {
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🧹"}
        accent={TEMPLATE?.accent}
        message="Loading your data…"
      />
    );
  }

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="🧹💰"
        title="Connecting to ChoreBoard…"
        organizerLabel="the room owner"
      />
    );
  }

  if (!currentMemberId || !store.getMember(currentMemberId)) {
    return <ProfilePicker />;
  }

  const me = store.getMember(currentMemberId)!;
  if (me.role === "parent" && !hasAdminAccess) {
    return <ParentGate />;
  }

  return me.role === "parent" ? (
    <ParentView memberId={me.id} />
  ) : (
    <KidView memberId={me.id} />
  );
}
