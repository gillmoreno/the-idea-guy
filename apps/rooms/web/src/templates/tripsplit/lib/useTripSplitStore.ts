"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { TripSplitStore } from "./store";

export function useTripSplitStore(): TripSplitStore | null {
  const { docs, version } = useRoomSession();
  const [tripStore, setTripStore] = useState<TripSplitStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setTripStore(null);
      return;
    }
    setTripStore(new TripSplitStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return tripStore;
}
