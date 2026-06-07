"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { BookClubStore } from "./store";

export function useBookClubStore(): BookClubStore | null {
  const { store, version } = useRoomSession();
  const [clubStore, setClubStore] = useState<BookClubStore | null>(null);

  useEffect(() => {
    if (!store) {
      setClubStore(null);
      return;
    }
    setClubStore(new BookClubStore(store.publicDoc, store.adminDoc));
  }, [store, version]);

  return clubStore;
}
