"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { GroupFundStore } from "./store";

export function useGroupFundStore(): GroupFundStore | null {
  const { docs, version } = useRoomSession();
  const [store, setStore] = useState<GroupFundStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setStore(null);
      return;
    }
    setStore(new GroupFundStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return store;
}
