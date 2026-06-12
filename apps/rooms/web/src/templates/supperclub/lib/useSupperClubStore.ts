"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { SupperClubStore } from "./store";

export function useSupperClubStore(): SupperClubStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<SupperClubStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new SupperClubStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
