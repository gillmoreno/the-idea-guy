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
import { Y } from "@the-idea-guy/room-kit";
import {
  APP_ID,
  LocalFirstDoc,
  SyncState,
  TemplateId,
  adminKeyMaterial,
  loadVault,
  publicKeyMaterial,
  touchVaultRoom,
} from "@the-idea-guy/room-kit";
import { useDevice } from "./DeviceProvider";
import { ChoreStore } from "@/templates/choreboard/lib/store";
import { clearMemberSecrets } from "@/templates/choreboard/lib/memberSecrets";

const LS_MEMBER = "rooms.currentMemberId";

function mergeSync(a: SyncState, b: SyncState): SyncState {
  return {
    localLoaded: a.localLoaded && b.localLoaded,
    connected: a.connected || b.connected,
  };
}

interface JoinOpts {
  asOwner?: boolean;
  adminSecret?: string;
  templateId: TemplateId;
  roomName?: string;
  memberId?: string;
  displayName?: string;
}

interface RoomSessionCtx {
  mounted: boolean;
  roomCode: string | null;
  templateId: TemplateId | null;
  hasAdminAccess: boolean;
  isOwner: boolean;
  store: ChoreStore | null;
  sync: SyncState;
  version: number;
  currentMemberId: string | null;
  relayUrl: string;
  joinRoom: (roomCode: string, opts: JoinOpts) => void;
  unlockAdmin: (adminSecret: string) => void;
  leaveRoom: () => void;
  setCurrentMember: (id: string | null) => void;
  /** ChoreBoard-compat aliases */
  familyCode: string | null;
  hasParentAccess: boolean;
  isCreator: boolean;
  unlockParent: (secret: string) => void;
  join: (
    code: string,
    opts?: { asCreator?: boolean; parentSecret?: string; templateId?: TemplateId },
  ) => void;
  leave: () => void;
}

const Ctx = createContext<RoomSessionCtx | null>(null);

export function RoomSessionProvider({
  roomCode: initialRoomCode,
  children,
}: {
  roomCode: string | null;
  children: React.ReactNode;
}) {
  const { relayUrl, saveRoom, forgetRoom } = useDevice();
  const [mounted, setMounted] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(initialRoomCode);
  const [templateId, setTemplateId] = useState<TemplateId | null>(null);
  const [adminSecret, setAdminSecret] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
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

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setRoomCode(initialRoomCode);
    if (!initialRoomCode) return;
    const vaultRoom = loadVault().rooms[initialRoomCode];
    if (vaultRoom) {
      setTemplateId(vaultRoom.templateId);
      setAdminSecret(vaultRoom.adminSecret ?? null);
      setIsOwner(!!vaultRoom.isOwner);
      setCurrentMemberId(vaultRoom.memberId ?? localStorage.getItem(LS_MEMBER));
      touchVaultRoom(loadVault(), initialRoomCode);
    }
  }, [initialRoomCode]);

  const teardown = () => {
    publicRef.current?.destroy();
    adminRef.current?.destroy();
    publicRef.current = null;
    adminRef.current = null;
    setStore(null);
  };

  const readTemplateFromDoc = (doc: Y.Doc): TemplateId | null => {
    const id = doc.getMap("meta").get("templateId");
    return typeof id === "string" ? id : null;
  };

  const refreshStore = useCallback(() => {
    const p = publicRef.current;
    const a = adminRef.current;
    queueMicrotask(() => {
      if (p) {
        const fromDoc = readTemplateFromDoc(p.doc);
        if (fromDoc) setTemplateId(fromDoc);
        setStore(new ChoreStore(p.doc, a?.doc ?? null));
      }
      bump();
    });
  }, []);

  const wireDocs = useCallback(
    (code: string, admin: string | null, relay: string) => {
      teardown();
      setSync({ localLoaded: false, connected: false });
      pubSync.current = { localLoaded: false, connected: false };
      admSync.current = { localLoaded: false, connected: false };

      const pub = new LocalFirstDoc({
        appId: APP_ID,
        roomCode: code,
        keyMaterial: publicKeyMaterial(code),
        scope: "public",
        relayUrl: relay,
        onChange: refreshStore,
        onState: (s) => {
          pubSync.current = s;
          applySyncState();
          if (s.localLoaded) refreshStore();
        },
      });
      publicRef.current = pub;

      if (admin) {
        const adm = new LocalFirstDoc({
          appId: APP_ID,
          roomCode: code,
          keyMaterial: adminKeyMaterial(code, admin),
          scope: "admin",
          relayUrl: relay,
          onChange: refreshStore,
          onState: (s) => {
            admSync.current = s;
            applySyncState();
          },
        });
        adminRef.current = adm;
      } else {
        adminRef.current = null;
        admSync.current = { localLoaded: true, connected: false };
      }

      refreshStore();
    },
    [refreshStore],
  );

  useEffect(() => {
    if (!roomCode) {
      teardown();
      return;
    }
    wireDocs(roomCode, adminSecret, relayUrl);
    return teardown;
  }, [roomCode, adminSecret, relayUrl, wireDocs]);

  const joinRoom = useCallback(
    (code: string, opts: JoinOpts) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      const memberId = opts.memberId ?? `m_${Date.now().toString(36)}`;
      const secret = opts.adminSecret?.trim();

      saveRoom({
        roomCode: trimmed,
        templateId: opts.templateId,
        roomName: opts.roomName,
        memberId,
        displayName: opts.displayName,
        adminSecret: secret,
        isOwner: !!opts.asOwner,
        lastOpenedAt: Date.now(),
      });

      if (secret) setAdminSecret(secret);
      setIsOwner(!!opts.asOwner);
      setTemplateId(opts.templateId);
      setCurrentMemberId(memberId);
      localStorage.setItem(LS_MEMBER, memberId);
      setRoomCode(trimmed);
    },
    [saveRoom],
  );

  const unlockAdmin = useCallback(
    (secret: string) => {
      const trimmed = secret.trim();
      if (!trimmed || !roomCode) return;
      setAdminSecret(trimmed);
      const vaultRoom = loadVault().rooms[roomCode];
      if (vaultRoom) saveRoom({ ...vaultRoom, adminSecret: trimmed });
    },
    [roomCode, saveRoom],
  );

  const leaveRoom = useCallback(() => {
    if (roomCode) forgetRoom(roomCode);
    clearMemberSecrets();
    localStorage.removeItem(LS_MEMBER);
    setAdminSecret(null);
    setIsOwner(false);
    setTemplateId(null);
    setCurrentMemberId(null);
    setRoomCode(null);
    teardown();
  }, [forgetRoom, roomCode]);

  const setCurrentMember = useCallback(
    (id: string | null) => {
      if (id) localStorage.setItem(LS_MEMBER, id);
      else localStorage.removeItem(LS_MEMBER);
      setCurrentMemberId(id);
      if (roomCode) {
        const vaultRoom = loadVault().rooms[roomCode];
        if (vaultRoom) saveRoom({ ...vaultRoom, memberId: id ?? vaultRoom.memberId });
      }
    },
    [roomCode, saveRoom],
  );

  const joinCompat = useCallback(
    (
      code: string,
      opts?: { asCreator?: boolean; parentSecret?: string; templateId?: TemplateId },
    ) => {
      joinRoom(code, {
        asOwner: opts?.asCreator,
        adminSecret: opts?.parentSecret,
        templateId: opts?.templateId ?? "choreboard",
      });
    },
    [joinRoom],
  );

  const value = useMemo(
    () => ({
      mounted,
      roomCode,
      templateId,
      hasAdminAccess: !!adminSecret,
      isOwner,
      store,
      sync,
      version,
      currentMemberId,
      relayUrl,
      joinRoom,
      unlockAdmin,
      leaveRoom,
      setCurrentMember,
      familyCode: roomCode,
      hasParentAccess: !!adminSecret,
      isCreator: isOwner,
      unlockParent: unlockAdmin,
      join: joinCompat,
      leave: leaveRoom,
    }),
    [
      mounted,
      roomCode,
      templateId,
      adminSecret,
      isOwner,
      store,
      sync,
      version,
      currentMemberId,
      relayUrl,
      joinRoom,
      unlockAdmin,
      leaveRoom,
      setCurrentMember,
      joinCompat,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRoomSession(): RoomSessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRoomSession must be used within RoomSessionProvider");
  return ctx;
}

export function useChoreBoard(): RoomSessionCtx {
  return useRoomSession();
}
