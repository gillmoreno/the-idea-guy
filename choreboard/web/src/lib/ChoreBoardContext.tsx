"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LocalFirstDoc, SyncState } from "@/kit/sync";
import { adminKeyMaterial, publicKeyMaterial } from "@/kit/crypto";
import { APP_ID, ChoreStore } from "@/lib/store";
import { clearMemberSecrets } from "@/lib/memberSecrets";

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL || "ws://localhost:4500";
const LS_FAMILY = "choreboard.familyCode";
const LS_PARENT = "choreboard.parentSecret";
const LS_MEMBER = "choreboard.memberId";
const LS_CREATOR = "choreboard.creator";

function mergeSync(a: SyncState, b: SyncState): SyncState {
  return {
    localLoaded: a.localLoaded && b.localLoaded,
    connected: a.connected || b.connected,
  };
}

interface JoinOpts {
  asCreator?: boolean;
  parentSecret?: string;
}

interface ChoreBoardCtx {
  mounted: boolean;
  familyCode: string | null;
  hasParentAccess: boolean;
  isCreator: boolean;
  store: ChoreStore | null;
  sync: SyncState;
  version: number;
  currentMemberId: string | null;
  join: (familyCode: string, opts?: JoinOpts) => void;
  unlockParent: (parentSecret: string) => void;
  leave: () => void;
  setCurrentMember: (id: string | null) => void;
}

const Ctx = createContext<ChoreBoardCtx | null>(null);

export function ChoreBoardProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [familyCode, setFamilyCode] = useState<string | null>(null);
  const [parentSecret, setParentSecret] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [store, setStore] = useState<ChoreStore | null>(null);
  const [sync, setSync] = useState<SyncState>({ localLoaded: false, connected: false });
  const [version, setVersion] = useState(0);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  const publicRef = useRef<LocalFirstDoc | null>(null);
  const adminRef = useRef<LocalFirstDoc | null>(null);
  const pubSync = useRef<SyncState>({ localLoaded: false, connected: false });
  const admSync = useRef<SyncState>({ localLoaded: false, connected: false });

  const bump = () => setVersion((v) => v + 1);

  const applySyncState = () => {
    const pub = pubSync.current;
    const adm = adminRef.current ? admSync.current : { localLoaded: true, connected: true };
    setSync(mergeSync(pub, adm));
  };

  useEffect(() => {
    setMounted(true);
    setFamilyCode(localStorage.getItem(LS_FAMILY));
    setParentSecret(localStorage.getItem(LS_PARENT));
    setCurrentMemberId(localStorage.getItem(LS_MEMBER));
    setIsCreator(localStorage.getItem(LS_CREATOR) === "1");
  }, []);

  const teardown = () => {
    publicRef.current?.destroy();
    adminRef.current?.destroy();
    publicRef.current = null;
    adminRef.current = null;
    setStore(null);
  };

  const wireDocs = useCallback((code: string, parent: string | null) => {
    teardown();
    setSync({ localLoaded: false, connected: false });
    pubSync.current = { localLoaded: false, connected: false };
    admSync.current = { localLoaded: false, connected: false };

    const pub = new LocalFirstDoc({
      appId: APP_ID,
      familyCode: code,
      keyMaterial: publicKeyMaterial(code),
      scope: "public",
      relayUrl: RELAY_URL,
      onChange: bump,
      onState: (s) => {
        pubSync.current = s;
        applySyncState();
      },
    });
    publicRef.current = pub;

    let admin: LocalFirstDoc | null = null;
    if (parent) {
      admin = new LocalFirstDoc({
        appId: APP_ID,
        familyCode: code,
        keyMaterial: adminKeyMaterial(code, parent),
        scope: "admin",
        relayUrl: RELAY_URL,
        onChange: bump,
        onState: (s) => {
          admSync.current = s;
          applySyncState();
        },
      });
      adminRef.current = admin;
    } else {
      adminRef.current = null;
      admSync.current = { localLoaded: true, connected: false };
    }

    setStore(new ChoreStore(pub.doc, admin?.doc ?? null));
    bump();
  }, []);

  useEffect(() => {
    if (!familyCode) return;
    wireDocs(familyCode, parentSecret);
    return teardown;
  }, [familyCode, parentSecret, wireDocs]);

  const join = useCallback((code: string, opts?: JoinOpts) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    localStorage.setItem(LS_FAMILY, trimmed);
    if (opts?.parentSecret) {
      localStorage.setItem(LS_PARENT, opts.parentSecret.trim());
      setParentSecret(opts.parentSecret.trim());
    }
    localStorage.setItem(LS_CREATOR, opts?.asCreator ? "1" : "0");
    setIsCreator(!!opts?.asCreator);
    setFamilyCode(trimmed);
  }, []);

  const unlockParent = useCallback((secret: string) => {
    const trimmed = secret.trim();
    if (!trimmed || !familyCode) return;
    localStorage.setItem(LS_PARENT, trimmed);
    setParentSecret(trimmed);
  }, [familyCode]);

  const leave = useCallback(() => {
    localStorage.removeItem(LS_FAMILY);
    localStorage.removeItem(LS_PARENT);
    localStorage.removeItem(LS_MEMBER);
    localStorage.removeItem(LS_CREATOR);
    clearMemberSecrets();
    setCurrentMemberId(null);
    setParentSecret(null);
    setIsCreator(false);
    setFamilyCode(null);
  }, []);

  const setCurrentMember = useCallback((id: string | null) => {
    if (id) localStorage.setItem(LS_MEMBER, id);
    else localStorage.removeItem(LS_MEMBER);
    setCurrentMemberId(id);
  }, []);

  return (
    <Ctx.Provider
      value={{
        mounted,
        familyCode,
        hasParentAccess: !!parentSecret,
        isCreator,
        store,
        sync,
        version,
        currentMemberId,
        join,
        unlockParent,
        leave,
        setCurrentMember,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useChoreBoard(): ChoreBoardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChoreBoard must be used within ChoreBoardProvider");
  return ctx;
}
