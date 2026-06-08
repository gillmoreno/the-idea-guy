"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { FitCrewStore } from "./store";

export function useFitCrewStore(): FitCrewStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<FitCrewStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new FitCrewStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
