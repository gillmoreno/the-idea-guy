"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { SchemaStore } from "./store";

export function useSchemaStore(): SchemaStore | null {
  const { docs, roomSchema, version } = useRoomSession();
  const [schemaStore, setSchemaStore] = useState<SchemaStore | null>(null);

  useEffect(() => {
    if (!docs || !roomSchema) {
      setSchemaStore(null);
      return;
    }
    setSchemaStore(new SchemaStore(docs.publicDoc, docs.adminDoc, roomSchema));
  }, [docs, roomSchema, version]);

  return schemaStore;
}
