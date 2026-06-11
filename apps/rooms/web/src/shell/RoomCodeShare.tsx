"use client";

import { memberJoinUrl } from "@the-idea-guy/room-kit";
import { useDevice } from "@/shell/DeviceProvider";
import { QRBlock } from "./QRBlock";

export function RoomCodeShare({
  roomCode,
  hint,
  qrLabel = "Scan to join",
  passphraseProtected,
}: {
  roomCode: string | null | undefined;
  hint?: string;
  qrLabel?: string;
  passphraseProtected?: boolean;
}) {
  const { vault } = useDevice();
  const protectedRoom =
    passphraseProtected ??
    (roomCode ? !!vault.rooms[roomCode.trim()]?.passphraseProtected : false);
  if (!roomCode) return null;
  return (
    <>
      <div className="code-box">{roomCode}</div>
      <div style={{ textAlign: "center" }}>
        <QRBlock
          value={memberJoinUrl(roomCode, { passphraseProtected: protectedRoom })}
          label={qrLabel}
        />
      </div>
      {protectedRoom ? (
        <p className="muted" style={{ fontSize: 12 }}>
          This room also requires a passphrase — share it separately, never in the link.
        </p>
      ) : null}
      {hint && (
        <p className="muted" style={{ fontSize: 12 }}>
          {hint}
        </p>
      )}
    </>
  );
}
