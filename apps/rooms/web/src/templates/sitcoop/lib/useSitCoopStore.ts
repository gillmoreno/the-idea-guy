"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { SitCoopStore } from "./store";

export function useSitCoopStore(): SitCoopStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<SitCoopStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new SitCoopStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
