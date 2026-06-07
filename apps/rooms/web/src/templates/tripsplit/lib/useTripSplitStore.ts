"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { TripSplitStore } from "./store";

export function useTripSplitStore(): TripSplitStore | null {
  const { store, version } = useRoomSession();
  const [tripStore, setTripStore] = useState<TripSplitStore | null>(null);

  useEffect(() => {
    if (!store) {
      setTripStore(null);
      return;
    }
    setTripStore(new TripSplitStore(store.publicDoc, store.adminDoc));
  }, [store, version]);

  return tripStore;
}
