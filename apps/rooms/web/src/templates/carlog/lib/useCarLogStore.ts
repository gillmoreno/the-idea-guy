"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { CarLogStore } from "./store";

export function useCarLogStore(): CarLogStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<CarLogStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new CarLogStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
