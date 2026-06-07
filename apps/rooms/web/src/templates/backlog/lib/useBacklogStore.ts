"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { BacklogStore } from "./store";

export function useBacklogStore(): BacklogStore | null {
  const { store, version } = useRoomSession();
  const [backlogStore, setBacklogStore] = useState<BacklogStore | null>(null);

  useEffect(() => {
    if (!store) {
      setBacklogStore(null);
      return;
    }
    setBacklogStore(new BacklogStore(store.publicDoc, store.adminDoc));
  }, [store, version]);

  return backlogStore;
}
