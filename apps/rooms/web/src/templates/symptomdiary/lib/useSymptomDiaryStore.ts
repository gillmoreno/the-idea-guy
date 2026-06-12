"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { SymptomDiaryStore } from "./store";

export function useSymptomDiaryStore(): SymptomDiaryStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<SymptomDiaryStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new SymptomDiaryStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
