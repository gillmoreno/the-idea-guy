"use client";

import { memberJoinUrl } from "@the-idea-guy/room-kit";
import { QRBlock } from "./QRBlock";

export function RoomCodeShare({
  roomCode,
  hint,
  qrLabel = "Scan to join",
}: {
  roomCode: string | null | undefined;
  hint?: string;
  qrLabel?: string;
}) {
  if (!roomCode) return null;
  return (
    <>
      <div className="code-box">{roomCode}</div>
      <div style={{ textAlign: "center" }}>
        <QRBlock value={memberJoinUrl(roomCode)} label={qrLabel} />
      </div>
      {hint && (
        <p className="muted" style={{ fontSize: 12 }}>
          {hint}
        </p>
      )}
    </>
  );
}
