"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { BookClubStore } from "./store";

export function useBookClubStore(): BookClubStore | null {
  const { docs, version } = useRoomSession();
  const [clubStore, setClubStore] = useState<BookClubStore | null>(null);

  useEffect(() => {
    if (!docs) {
      setClubStore(null);
      return;
    }
    setClubStore(new BookClubStore(docs.publicDoc, docs.adminDoc));
  }, [docs, version]);

  return clubStore;
}
