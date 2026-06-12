"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { CareCircleStore } from "./store";

export function useCareCircleStore(): CareCircleStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<CareCircleStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new CareCircleStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
