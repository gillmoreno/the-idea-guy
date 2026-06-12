"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ScorePadStore } from "./store";

export function useScorePadStore(): ScorePadStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<ScorePadStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new ScorePadStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
