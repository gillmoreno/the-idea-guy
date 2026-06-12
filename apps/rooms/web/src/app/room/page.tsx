"use client";

import { Suspense, useEffect, useState } from "react";
import { parseRoomCodeFromLocation } from "@the-idea-guy/room-kit";
import { RoomSessionProvider } from "@/shell/RoomSessionProvider";
import { TemplateApp } from "@/templates/TemplateApp";

function RoomInner() {
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return parseRoomCodeFromLocation(window.location.search, window.location.hash);
  });

  // Keep the room code in the URL hash — it is this page's identity, not a
  // one-time secret. Stripping it (as /join does for admin secrets) left the
  // code only in component state, so any remount — Strict Mode in dev, or a
  // plain refresh in prod — re-read an empty hash and showed "Missing room code".
  // Hashes are never sent to servers/CDN logs, so keeping it satisfies the rule.
  useEffect(() => {
    const code = parseRoomCodeFromLocation(window.location.search, window.location.hash);
    if (code) setRoomCode(code);
  }, []);

  if (!roomCode) {
    return (
      <div className="centered">
        <h1>Missing room code</h1>
        <p className="muted">Open a room from your home screen or use an invite link.</p>
        <a className="btn btn-primary" href="/">
          Home
        </a>
      </div>
    );
  }

  return (
    <RoomSessionProvider roomCode={roomCode}>
      <TemplateApp />
    </RoomSessionProvider>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="centered muted">Loading room…</div>}>
      <RoomInner />
    </Suspense>
  );
}
