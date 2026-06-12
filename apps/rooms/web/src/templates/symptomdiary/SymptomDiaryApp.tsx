"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { MainView } from "./components/MainView";
import { getBuiltinTemplate } from "../registry";
import { useSymptomDiaryStore } from "./lib/useSymptomDiaryStore";

const TEMPLATE = getBuiltinTemplate("symptomdiary");

export function SymptomDiaryApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useSymptomDiaryStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🩺"}
        accent={TEMPLATE?.accent}
        message="Starting Symptom Diary…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🩺"}
        accent={TEMPLATE?.accent}
        message="Loading the diary…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="🩺📓"
        title="Connecting to the diary…"
        organizerLabel="whoever set up the diary"
      />
    );
  }

  if (!currentMemberId || !store.getObserver(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <MainView memberId={currentMemberId} />;
}
