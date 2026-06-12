"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { CabinCalStore } from "./store";

export function useCabinCalStore(): CabinCalStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<CabinCalStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new CabinCalStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
