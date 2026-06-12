"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { CarpoolStore } from "./store";

export function useCarpoolStore(): CarpoolStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<CarpoolStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new CarpoolStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
