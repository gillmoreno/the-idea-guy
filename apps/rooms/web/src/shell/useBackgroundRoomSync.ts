"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isBackgroundRoomSyncEnabled, listVaultRooms, loadVault } from "@the-idea-guy/room-kit";
import { useDevice } from "./DeviceProvider";
import {
  BackgroundRoomSyncManager,
  type BackgroundSyncProgress,
} from "./backgroundRoomSyncManager";

const IDLE_PROGRESS: BackgroundSyncProgress = {
  status: "idle",
  completed: 0,
  total: 0,
  updatedRoomCodes: [],
};

/**
 * Pull relay updates for vault rooms while the home screen is visible.
 * Skips when background sync is disabled in vault settings.
 */
export function useBackgroundRoomSync(active: boolean) {
  const { mounted, rooms, relayUrl, vault, refreshVault } = useDevice();
  const managerRef = useRef<BackgroundRoomSyncManager | null>(null);
  const [progress, setProgress] = useState<BackgroundSyncProgress>(IDLE_PROGRESS);

  const enabled = isBackgroundRoomSyncEnabled(vault);
  const roomCodesKey = useMemo(
    () =>
      rooms
        .map((r) => r.roomCode)
        .sort()
        .join("\n"),
    [rooms],
  );

  useEffect(() => {
    const manager = new BackgroundRoomSyncManager(relayUrl, setProgress, refreshVault);
    managerRef.current = manager;
    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [relayUrl, refreshVault]);

  const runSync = useCallback(() => {
    if (!enabled || !managerRef.current) return;
    const vaultRooms = listVaultRooms(loadVault());
    void managerRef.current.syncRooms(vaultRooms);
  }, [enabled]);

  useEffect(() => {
    if (!mounted || !active || !enabled || !roomCodesKey) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    runSync();
  }, [mounted, active, enabled, roomCodesKey, relayUrl, runSync]);

  useEffect(() => {
    if (!active || !enabled) return;

    const onVisibility = () => {
      if (document.visibilityState === "visible") runSync();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [active, enabled, runSync]);

  return {
    enabled,
    progress,
    syncNow: runSync,
    isSyncing: progress.status === "syncing",
  };
}
