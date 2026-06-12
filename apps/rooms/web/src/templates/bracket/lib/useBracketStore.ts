"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { BracketStore } from "./store";

export function useBracketStore(): BracketStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<BracketStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new BracketStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
