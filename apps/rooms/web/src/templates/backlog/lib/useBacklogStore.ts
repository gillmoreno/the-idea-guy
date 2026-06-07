"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { BacklogStore } from "./store";

export function useBacklogStore(): BacklogStore | null {
  const { docs, version } = useRoomSession();
  const [backlogStore, setBacklogStore] = useState<BacklogStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setBacklogStore(null);
      return;
    }
    setBacklogStore(new BacklogStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return backlogStore;
}
