"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { DoseLogStore } from "./store";

export function useDoseLogStore(): DoseLogStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<DoseLogStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new DoseLogStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
