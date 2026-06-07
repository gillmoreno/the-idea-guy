"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LocalFirstDoc, SyncState } from "@/kit/sync";
import { APP_ID, NoteStore } from "@/lib/store";
import { NoteSearchIndex } from "@/lib/search";

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL || "ws://localhost:4501";

/** HTTP origin for the sync relay (CORS tunnel for AI forward only — no keys on server). */
function relayHttpUrl(wsUrl: string): string {
  if (process.env.NEXT_PUBLIC_RELAY_HTTP_URL) {
    return process.env.NEXT_PUBLIC_RELAY_HTTP_URL;
  }
  return wsUrl.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
}

const RELAY_HTTP_URL = relayHttpUrl(RELAY_URL);
const LS_CODE = "secondbrain.inviteCode";
const LS_CREATOR = "secondbrain.creator";
const LS_ACTIVE = "secondbrain.activeNoteId";

interface SecondBrainCtx {
  mounted: boolean;
  inviteCode: string | null;
  isCreator: boolean;
  store: NoteStore | null;
  searchIndex: NoteSearchIndex;
  sync: SyncState;
  version: number;
  activeNoteId: string | null;
  join: (code: string, asCreator?: boolean) => void;
  leave: () => void;
  setActiveNoteId: (id: string | null) => void;
  refreshSearch: () => void;
  compactVault: () => Promise<{ before: number; after: number } | null>;
}

const Ctx = createContext<SecondBrainCtx | null>(null);

export function SecondBrainProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [store, setStore] = useState<NoteStore | null>(null);
  const [sync, setSync] = useState<SyncState>({ localLoaded: false, connected: false });
  const [version, setVersion] = useState(0);
  const [activeNoteId, setActiveNoteIdState] = useState<string | null>(null);
  const searchIndexRef = useRef(new NoteSearchIndex());

  const lfRef = useRef<LocalFirstDoc | null>(null);

  const refreshSearch = useCallback(() => {
    if (!lfRef.current) return;
    const s = new NoteStore(lfRef.current.doc);
    searchIndexRef.current.rebuild(s.notesForSearch());
  }, []);

  useEffect(() => {
    setMounted(true);
    const code = localStorage.getItem(LS_CODE);
    const active = localStorage.getItem(LS_ACTIVE);
    setActiveNoteIdState(active);
    setIsCreator(localStorage.getItem(LS_CREATOR) === "1");
    if (code) setInviteCode(code);
  }, []);

  useEffect(() => {
    if (!inviteCode) return;
    setSync({ localLoaded: false, connected: false });
    const lf = new LocalFirstDoc({
      appId: APP_ID,
      inviteCode,
      relayUrl: RELAY_URL,
      onChange: () => {
        setVersion((v) => v + 1);
        refreshSearch();
      },
      onState: (s) => setSync(s),
    });
    lfRef.current = lf;
    const ns = new NoteStore(lf.doc);
    setStore(ns);
    searchIndexRef.current.rebuild(ns.notesForSearch());
    setVersion((v) => v + 1);
    return () => {
      lf.destroy();
      lfRef.current = null;
      setStore(null);
    };
  }, [inviteCode, refreshSearch]);

  const join = useCallback((code: string, asCreator = false) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    localStorage.setItem(LS_CODE, trimmed);
    localStorage.setItem(LS_CREATOR, asCreator ? "1" : "0");
    setIsCreator(asCreator);
    setInviteCode(trimmed);
  }, []);

  const leave = useCallback(() => {
    localStorage.removeItem(LS_CODE);
    localStorage.removeItem(LS_CREATOR);
    localStorage.removeItem(LS_ACTIVE);
    setActiveNoteIdState(null);
    setIsCreator(false);
    setInviteCode(null);
  }, []);

  const setActiveNoteId = useCallback((id: string | null) => {
    if (id) localStorage.setItem(LS_ACTIVE, id);
    else localStorage.removeItem(LS_ACTIVE);
    setActiveNoteIdState(id);
  }, []);

  const compactVault = useCallback(async () => {
    const lf = lfRef.current;
    if (!lf) return null;
    const result = await lf.compactStorage();
    if (result.after > 0 || result.before > 0) {
      setVersion((v) => v + 1);
      refreshSearch();
    }
    return result;
  }, [refreshSearch]);

  const value = useMemo(
    () => ({
      mounted,
      inviteCode,
      isCreator,
      store,
      searchIndex: searchIndexRef.current,
      sync,
      version,
      activeNoteId,
      join,
      leave,
      setActiveNoteId,
      refreshSearch,
      compactVault,
    }),
    [
      mounted,
      inviteCode,
      isCreator,
      store,
      sync,
      version,
      activeNoteId,
      join,
      leave,
      setActiveNoteId,
      refreshSearch,
      compactVault,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSecondBrain(): SecondBrainCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSecondBrain must be used within SecondBrainProvider");
  return ctx;
}

export { RELAY_HTTP_URL };
