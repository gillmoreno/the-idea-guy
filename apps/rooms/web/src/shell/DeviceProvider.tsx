"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  APP_ID,
  DEFAULT_RELAY_URL,
  DeviceVault,
  VaultRoom,
  getRelayUrl,
  listVaultRooms,
  loadVault,
  removeVaultRoom,
  setRelayUrlOverride as persistRelayOverride,
  upsertVaultRoom,
} from "@the-idea-guy/room-kit";
import { purgeRoomFromDevice } from "@/lib/purgeRoomFromDevice";

interface DeviceCtx {
  mounted: boolean;
  vault: DeviceVault;
  rooms: VaultRoom[];
  relayUrl: string;
  defaultRelayUrl: string;
  refreshVault: () => void;
  setRelayUrlOverride: (url: string | null) => void;
  saveRoom: (room: VaultRoom) => void;
  forgetRoom: (roomCode: string) => void;
  removeRoomFromDevice: (roomCode: string) => Promise<void>;
}

const Ctx = createContext<DeviceCtx | null>(null);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [vault, setVault] = useState<DeviceVault>(() => loadVault());

  useEffect(() => setMounted(true), []);

  const refreshVault = useCallback(() => setVault(loadVault()), []);

  const relayUrl = useMemo(() => getRelayUrl(vault, DEFAULT_RELAY_URL), [vault]);
  const rooms = useMemo(() => listVaultRooms(vault), [vault]);

  const setRelayUrlOverride = useCallback(
    (url: string | null) => {
      setVault(persistRelayOverride(loadVault(), url));
    },
    [],
  );

  const saveRoom = useCallback((room: VaultRoom) => {
    setVault(upsertVaultRoom(loadVault(), room));
  }, []);

  const forgetRoom = useCallback((roomCode: string) => {
    setVault(removeVaultRoom(loadVault(), roomCode));
  }, []);

  const removeRoomFromDevice = useCallback(async (roomCode: string) => {
    await purgeRoomFromDevice(roomCode);
    refreshVault();
  }, [refreshVault]);

  return (
    <Ctx.Provider
      value={{
        mounted,
        vault,
        rooms,
        relayUrl,
        defaultRelayUrl: DEFAULT_RELAY_URL,
        refreshVault,
        setRelayUrlOverride,
        saveRoom,
        forgetRoom,
        removeRoomFromDevice,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useDevice(): DeviceCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDevice must be used within DeviceProvider");
  return ctx;
}

export { APP_ID };
