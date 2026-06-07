"use client";

import { useEffect, useState } from "react";
import { APP_ID } from "@the-idea-guy/room-kit/constants";
import { formatBytes, measureRoomLocalBytes } from "@the-idea-guy/room-kit/storage";

export function useRoomLocalBytes(roomCode: string | null, includeAdmin = false) {
  const [bytes, setBytes] = useState<number | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setBytes(null);
      return;
    }
    let cancelled = false;
    setBytes(null);

    void measureRoomLocalBytes(roomCode, includeAdmin, APP_ID).then((n) => {
      if (!cancelled) setBytes(n);
    });

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void measureRoomLocalBytes(roomCode, includeAdmin, APP_ID).then((n) => {
        if (!cancelled) setBytes(n);
      });
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [roomCode, includeAdmin]);

  return {
    bytes,
    label: bytes == null ? "…" : formatBytes(bytes),
    loading: bytes == null,
  };
}
