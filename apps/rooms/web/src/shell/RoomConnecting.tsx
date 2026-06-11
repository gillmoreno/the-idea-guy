"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TemplateIcon } from "@/components/TemplateIcon";
import { useRoomSession } from "./RoomSessionProvider";

const SLOW_HINT_AFTER_MS = 20_000;

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
  const [waitedLong, setWaitedLong] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWaitedLong(true), SLOW_HINT_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

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
      {waitedLong && sync.connected && (
        <p style={{ fontSize: 13, marginTop: 12, maxWidth: 360, marginInline: "auto" }}>
          Still empty after a while? If this room has a <strong>passphrase</strong>, a wrong
          or missing passphrase looks exactly like an empty room. Leave the room and join
          again with the passphrase the organizer shared.
        </p>
      )}
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={leaveRoom}>
        Leave room
      </button>
      <Link className="btn btn-block" href="/" style={{ marginTop: 8 }}>
        Home
      </Link>
    </div>
  );
}
