"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ChoreStore } from "./store";

export function useChoreStore(): ChoreStore | null {
  const { docs, version } = useRoomSession();
  const [choreStore, setChoreStore] = useState<ChoreStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setChoreStore(null);
      return;
    }
    setChoreStore(new ChoreStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return choreStore;
}
