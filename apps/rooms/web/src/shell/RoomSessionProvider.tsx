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
  DECLARATIVE_TEMPLATE_ID,
  PENDING_TEMPLATE_ID,
  SyncState,
  TemplateId,
  TemplateKind,
  acknowledgeRoomSeen,
  adminKeyMaterial,
  hashDocState,
  loadVault,
  publicKeyMaterial,
  touchVaultRoom,
} from "@the-idea-guy/room-kit";
import { useRouter } from "next/navigation";
import { useDevice } from "./DeviceProvider";
import { clearMemberSecrets } from "@/templates/choreboard/lib/memberSecrets";
import { markRoomDeleted, readRoomMeta, writeRoomMeta, type ResolvedRoomMeta } from "./roomMeta";
import { inferTemplateFromDoc } from "./resolveRoomType";
import type { RoomSchema } from "@/schema/types";
import { peekPendingSchema } from "@/schema/pending";

const LS_MEMBER = "rooms.currentMemberId";

function vaultSnapshot(code: string | null) {
  if (!code) return null;
  return loadVault().rooms[code] ?? null;
}

function mergeSync(a: SyncState, b: SyncState): SyncState {
  return {
    localLoaded: a.localLoaded && b.localLoaded,
    connected: a.connected || b.connected,
  };
}

export interface RoomDocs {
  publicDoc: Y.Doc;
  adminDoc: Y.Doc | null;
}

interface JoinOpts {
  asOwner?: boolean;
  adminSecret?: string;
  templateKind?: TemplateKind;
  templateId: TemplateId;
  roomName?: string;
  memberId?: string;
  displayName?: string;
}

interface RoomSessionCtx {
  mounted: boolean;
  roomCode: string | null;
  templateKind: TemplateKind | null;
  templateId: TemplateId | null;
  roomSchema: RoomSchema | null;
  roomName: string | null;
  roomMeta: ResolvedRoomMeta | null;
  docs: RoomDocs | null;
  hasAdminAccess: boolean;
  isOwner: boolean;
  sync: SyncState;
  version: number;
  currentMemberId: string | null;
  relayUrl: string;
  joinRoom: (roomCode: string, opts: JoinOpts) => void;
  unlockAdmin: (adminSecret: string) => void;
  leaveRoom: () => void;
  /** Admin only: tombstone the room for everyone, checkpoint the relay, purge this device. */
  deleteRoom: () => Promise<void>;
  setCurrentMember: (id: string | null) => void;
  /** Prune CRDT history after large inline images. */
  compactRoom: () => Promise<void>;
}

const Ctx = createContext<RoomSessionCtx | null>(null);

export function RoomSessionProvider({
  roomCode: initialRoomCode,
  children,
}: {
  roomCode: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { relayUrl, saveRoom, forgetRoom, refreshVault, removeRoomFromDevice } = useDevice();
  const [mounted, setMounted] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(initialRoomCode);
  const [templateKind, setTemplateKind] = useState<TemplateKind | null>(() => {
    const v = vaultSnapshot(initialRoomCode);
    return v?.templateKind ?? (v?.templateId === DECLARATIVE_TEMPLATE_ID ? "declarative" : v ? "builtin" : null);
  });
  const [templateId, setTemplateId] = useState<TemplateId | null>(
    () => vaultSnapshot(initialRoomCode)?.templateId ?? null,
  );
  const [roomSchema, setRoomSchema] = useState<RoomSchema | null>(null);
  const [roomName, setRoomName] = useState<string | null>(
    () => vaultSnapshot(initialRoomCode)?.roomName ?? null,
  );
  const [adminSecret, setAdminSecret] = useState<string | null>(
    () => vaultSnapshot(initialRoomCode)?.adminSecret ?? null,
  );
  const [isOwner, setIsOwner] = useState(() => !!vaultSnapshot(initialRoomCode)?.isOwner);
  const [docs, setDocs] = useState<RoomDocs | null>(null);
  const [sync, setSync] = useState<SyncState>({ localLoaded: false, connected: false });
  const [version, setVersion] = useState(0);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  const publicRef = useRef<LocalFirstDoc | null>(null);
  const adminRef = useRef<LocalFirstDoc | null>(null);
  const pubSync = useRef<SyncState>({ localLoaded: false, connected: false });
  const admSync = useRef<SyncState>({ localLoaded: false, connected: false });
  const seenHashRef = useRef<string | null>(null);

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
      setTemplateKind(vaultRoom.templateKind ?? "builtin");
      setTemplateId(vaultRoom.templateId);
      setAdminSecret(vaultRoom.adminSecret ?? null);
      setIsOwner(!!vaultRoom.isOwner);
      setRoomName(vaultRoom.roomName ?? null);
      setCurrentMemberId(vaultRoom.memberId ?? localStorage.getItem(LS_MEMBER));
      touchVaultRoom(loadVault(), initialRoomCode);
    }
  }, [initialRoomCode]);

  const teardown = () => {
    publicRef.current?.destroy();
    adminRef.current?.destroy();
    publicRef.current = null;
    adminRef.current = null;
    setDocs(null);
  };

  const applyMetaFromDoc = useCallback(
    (code: string) => {
      const pub = publicRef.current;
      if (!pub) return;
      const doc = pub.doc;
      let meta = readRoomMeta(doc);
      const vaultRoom = loadVault().rooms[code];
      const inferred = inferTemplateFromDoc(doc);

      const resolvedId =
        (meta.templateId && meta.templateId !== PENDING_TEMPLATE_ID
          ? meta.templateId
          : null) ??
        (vaultRoom?.templateId && vaultRoom.templateId !== PENDING_TEMPLATE_ID
          ? vaultRoom.templateId
          : null) ??
        inferred;

      if (
        resolvedId &&
        resolvedId !== PENDING_TEMPLATE_ID &&
        (!meta.templateId || meta.templateId === PENDING_TEMPLATE_ID)
      ) {
        const kind: TemplateKind =
          vaultRoom?.templateKind ??
          (resolvedId === DECLARATIVE_TEMPLATE_ID ? "declarative" : "builtin");
        const pendingSchema =
          kind === "declarative" ? peekPendingSchema(code) : null;
        doc.transact(() => {
          writeRoomMeta(doc, {
            templateKind: kind,
            templateId: resolvedId,
            roomName: vaultRoom?.roomName ?? meta.roomName ?? "My room",
            schema: pendingSchema ?? meta.schema,
          });
        });
        meta = readRoomMeta(doc);
      }

      const effectiveId = meta.templateId || resolvedId;
      if (effectiveId && effectiveId !== PENDING_TEMPLATE_ID) setTemplateId(effectiveId);
      else if (inferred) setTemplateId(inferred);
      else if (vaultRoom?.templateId) setTemplateId(vaultRoom.templateId);

      if (meta.templateKind) setTemplateKind(meta.templateKind);
      else if (vaultRoom?.templateKind) setTemplateKind(vaultRoom.templateKind);
      else if (effectiveId === DECLARATIVE_TEMPLATE_ID) setTemplateKind("declarative");

      if (meta.schema) setRoomSchema(meta.schema);
      if (meta.roomName) setRoomName(meta.roomName);

      const syncId = meta.templateId && meta.templateId !== PENDING_TEMPLATE_ID
        ? meta.templateId
        : resolvedId && resolvedId !== PENDING_TEMPLATE_ID
          ? resolvedId
          : null;

      if (syncId && vaultRoom && vaultRoom.templateId !== syncId) {
        saveRoom({
          ...vaultRoom,
          templateId: syncId,
          templateKind:
            meta.templateKind ??
            vaultRoom.templateKind ??
            (syncId === DECLARATIVE_TEMPLATE_ID ? "declarative" : "builtin"),
          roomName: meta.roomName ?? vaultRoom.roomName,
        });
      }
    },
    [saveRoom],
  );

  const refreshDocs = useCallback(() => {
    const p = publicRef.current;
    const a = adminRef.current;
    queueMicrotask(() => {
      if (p) {
        setDocs({ publicDoc: p.doc, adminDoc: a?.doc ?? null });
        if (roomCode) applyMetaFromDoc(roomCode);
      } else {
        setDocs(null);
      }
      bump();
    });
  }, [applyMetaFromDoc, roomCode]);

  const wireDocs = useCallback(
    (code: string, admin: string | null, relay: string, passphrase?: string) => {
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
        passphrase,
        onChange: refreshDocs,
        onState: (s) => {
          pubSync.current = s;
          applySyncState();
          if (s.localLoaded) refreshDocs();
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
          passphrase,
          onChange: refreshDocs,
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

      refreshDocs();
    },
    [refreshDocs],
  );

  useEffect(() => {
    seenHashRef.current = null;
  }, [roomCode]);

  useEffect(() => {
    if (!sync.localLoaded || !roomCode || !publicRef.current) return;
    void (async () => {
      const hash = await hashDocState(publicRef.current!.doc);
      if (seenHashRef.current === hash) return;
      seenHashRef.current = hash;
      acknowledgeRoomSeen(loadVault(), roomCode, hash);
      refreshVault();
    })();
  }, [sync.localLoaded, roomCode, refreshVault]);

  useEffect(() => {
    if (!roomCode) {
      teardown();
      return;
    }
    const vaultRoom = loadVault().rooms[roomCode];
    wireDocs(roomCode, adminSecret, relayUrl, vaultRoom?.roomPassphrase);
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
        templateKind: opts.templateKind ?? "builtin",
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
      setTemplateKind(opts.templateKind ?? "builtin");
      setTemplateId(opts.templateId);
      setRoomName(opts.roomName ?? null);
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

  const resetSessionState = useCallback(() => {
    clearMemberSecrets();
    localStorage.removeItem(LS_MEMBER);
    setAdminSecret(null);
    setIsOwner(false);
    setTemplateKind(null);
    setTemplateId(null);
    setRoomSchema(null);
    setRoomName(null);
    setCurrentMemberId(null);
    setRoomCode(null);
    teardown();
  }, []);

  const leaveRoom = useCallback(() => {
    if (roomCode) forgetRoom(roomCode);
    resetSessionState();
    router.push("/");
  }, [forgetRoom, roomCode, resetSessionState, router]);

  const deleteRoom = useCallback(async () => {
    const pub = publicRef.current;
    if (!pub || !roomCode) return;
    const code = roomCode;
    // Tombstone first (broadcasts to connected members), then checkpoint so the
    // relay's stored backlog collapses to the tombstoned doc.
    pub.doc.transact(() => markRoomDeleted(pub.doc));
    await pub.compactStorage();
    resetSessionState();
    await removeRoomFromDevice(code);
    router.push("/");
  }, [roomCode, resetSessionState, removeRoomFromDevice, router]);

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

  const compactRoom = useCallback(async () => {
    await publicRef.current?.compactStorage();
  }, []);

  const roomMeta = useMemo(
    () =>
      docs
        ? readRoomMeta(docs.publicDoc)
        : null,
    [docs, version],
  );

  const value = useMemo(
    () => ({
      mounted,
      roomCode,
      templateKind,
      templateId,
      roomSchema,
      roomName,
      roomMeta,
      docs,
      hasAdminAccess: !!adminSecret,
      isOwner,
      sync,
      version,
      currentMemberId,
      relayUrl,
      joinRoom,
      unlockAdmin,
      leaveRoom,
      deleteRoom,
      setCurrentMember,
      compactRoom,
    }),
    [
      mounted,
      roomCode,
      templateKind,
      templateId,
      roomSchema,
      roomName,
      roomMeta,
      docs,
      adminSecret,
      isOwner,
      sync,
      version,
      currentMemberId,
      relayUrl,
      joinRoom,
      unlockAdmin,
      leaveRoom,
      deleteRoom,
      setCurrentMember,
      compactRoom,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRoomSession(): RoomSessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRoomSession must be used within RoomSessionProvider");
  return ctx;
}
