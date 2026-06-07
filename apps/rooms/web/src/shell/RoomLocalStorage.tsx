"use client";

import { useRoomLocalBytes } from "./useRoomLocalBytes";

interface RoomLocalStorageProps {
  roomCode: string | null;
  includeAdmin?: boolean;
  /** compact = one line; card = settings block */
  variant?: "compact" | "card";
  className?: string;
}

export function RoomLocalStorage({
  roomCode,
  includeAdmin = false,
  variant = "compact",
  className,
}: RoomLocalStorageProps) {
  const { label, loading } = useRoomLocalBytes(roomCode, includeAdmin);

  if (variant === "compact") {
    return (
      <span className={className ?? "muted"} style={{ fontSize: 12 }}>
        {loading ? "Measuring…" : `${label} on this device`}
      </span>
    );
  }

  return (
    <>
      <div className="section-title">Storage on this device</div>
      <div className="card stack-sm">
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Encrypted room data kept in your browser (IndexedDB). Not on our servers — only on
          this phone or computer.
        </p>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {loading ? "…" : label}
        </div>
        {!loading && (
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            {includeAdmin
              ? "Public + admin sync channels stored locally."
              : "Public sync channel stored locally."}
          </p>
        )}
      </div>
    </>
  );
}
