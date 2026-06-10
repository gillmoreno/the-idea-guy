"use client";

import { Suspense, useEffect, useState } from "react";
import { parseRoomCodeFromLocation, stripInviteParamsFromUrl } from "@the-idea-guy/room-kit";
import { RoomSessionProvider } from "@/shell/RoomSessionProvider";
import { TemplateApp } from "@/templates/TemplateApp";

function RoomInner() {
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return parseRoomCodeFromLocation(window.location.search, window.location.hash);
  });

  useEffect(() => {
    const code = parseRoomCodeFromLocation(window.location.search, window.location.hash);
    if (code) {
      stripInviteParamsFromUrl();
      setRoomCode(code);
    }
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
