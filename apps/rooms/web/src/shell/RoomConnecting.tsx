"use client";

import Link from "next/link";
import { TemplateIcon } from "@/components/TemplateIcon";
import { useRoomSession } from "./RoomSessionProvider";

export function RoomConnecting({
  emoji = "🔗",
  title,
  organizerLabel = "the room owner",
}: {
  emoji?: string;
  title: string;
  organizerLabel?: string;
}) {
  const { sync, relayUrl, leaveRoom } = useRoomSession();

  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <TemplateIcon emoji={emoji} size="lg" />
      <h1>{title}</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: 360, marginInline: "auto" }}>
        {sync.connected
          ? `Waiting for ${organizerLabel} to finish first-time setup, then sync.`
          : "Trying to reach the sync relay — check Wi‑Fi or relay settings."}
      </p>
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        Relay: {sync.connected ? "connected" : "not connected"} ·{" "}
        <span style={{ wordBreak: "break-all" }}>{relayUrl}</span>
      </p>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={leaveRoom}>
        Leave room
      </button>
      <Link className="btn btn-block" href="/" style={{ marginTop: 8 }}>
        Home
      </Link>
    </div>
  );
}
