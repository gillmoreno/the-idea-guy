"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLedgerStore } from "./store";

export function useRoomLedgerStore(): RoomLedgerStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<RoomLedgerStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new RoomLedgerStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
