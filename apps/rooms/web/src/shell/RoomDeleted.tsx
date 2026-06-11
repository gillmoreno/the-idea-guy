"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateIcon } from "@/components/TemplateIcon";
import { useDevice } from "./DeviceProvider";
import { useRoomSession } from "./RoomSessionProvider";

/** Shown to members when the room's deletion tombstone arrives. */
export function RoomDeleted() {
  const router = useRouter();
  const { roomCode, roomMeta, roomName } = useRoomSession();
  const { removeRoomFromDevice } = useDevice();
  const [busy, setBusy] = useState(false);

  const name = roomMeta?.roomName ?? roomName ?? "This room";

  const removeAndGoHome = async () => {
    setBusy(true);
    try {
      if (roomCode) await removeRoomFromDevice(roomCode);
    } finally {
      router.push("/");
    }
  };

  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <TemplateIcon emoji="🗑️" size="lg" />
      <h1>Room deleted</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: 360, marginInline: "auto" }}>
        <strong>{name}</strong> was deleted by its organizer. Your copy of the data is
        still on this device until you remove it.
      </p>
      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        disabled={busy}
        onClick={() => void removeAndGoHome()}
      >
        {busy ? "Removing…" : "Remove from this device"}
      </button>
    </div>
  );
}
