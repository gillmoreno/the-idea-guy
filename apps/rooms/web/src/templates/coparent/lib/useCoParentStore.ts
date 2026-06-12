"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { CoParentStore } from "./store";

export function useCoParentStore(): CoParentStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<CoParentStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new CoParentStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
