"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { WhosInStore } from "./store";

export function useWhosInStore(): WhosInStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<WhosInStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new WhosInStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
