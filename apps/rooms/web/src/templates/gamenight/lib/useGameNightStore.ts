"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { GameNightStore } from "./store";

export function useGameNightStore(): GameNightStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<GameNightStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new GameNightStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
