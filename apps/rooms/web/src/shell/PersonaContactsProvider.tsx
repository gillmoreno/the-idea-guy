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
import {
  type ContactCard,
  type ContactRecord,
  type ContactStatus,
  type DeviceVault,
  type InboxMessage,
  type PersonaRecord,
  canExchangeMessages,
  canSendFriendRequest,
  contactCardFromPersona,
  encodeContactCard,
  generatePersonaKeys,
  getContact,
  listContacts,
  loadVault,
  newFriendAccept,
  newFriendRequest,
  parseContactCard,
  savePersona,
  setInboxCursor,
  shouldSyncInbox,
  upsertContact,
} from "@the-idea-guy/room-kit";
import { useDevice } from "./DeviceProvider";
import { InboxSyncManager } from "./contacts/inboxSyncManager";
import { PersonaOnboarding } from "@/components/PersonaOnboarding";
import { DEFAULT_ACCENT } from "@/lib/accentValue";
import { avatarForContactCard } from "@/lib/avatarValue";

interface PersonaContactsCtx {
  persona: PersonaRecord | null;
  contacts: ContactRecord[];
  pendingIncoming: ContactRecord[];
  pendingOutgoing: ContactRecord[];
  mutual: ContactRecord[];
  blocked: ContactRecord[];
  myContactCard: string | null;
  createPersona: (displayName: string, color: string, avatar: string) => Promise<void>;
  addContactByCard: (raw: string) => { ok: boolean; error?: string };
  acceptContact: (personaId: string) => Promise<void>;
  blockContact: (personaId: string) => void;
  refresh: () => void;
}

const Ctx = createContext<PersonaContactsCtx | null>(null);

function contactFromMessage(
  base: ContactRecord,
  msg: InboxMessage,
): ContactRecord {
  return msg.fromAvatar ? { ...base, avatar: msg.fromAvatar } : base;
}

function applyIncomingMessage(
  vault: DeviceVault,
  personaId: string,
  msg: InboxMessage,
): DeviceVault {
  if (msg.fromPersonaId === vault.persona?.personaId) return vault;

  let v = vault;
  const existing = getContact(v, msg.fromPersonaId);

  if (existing?.status === "blocked") return v;

  if (msg.type === "friend_request") {
    if (existing?.status === "mutual") return v;
    const next = contactFromMessage(
      {
        personaId: msg.fromPersonaId,
        publicKey: msg.fromPersonaId,
        displayName: msg.fromName || existing?.displayName || "Contact",
        status: existing?.status === "pending_out" ? "mutual" : "pending_in",
        avatar: existing?.avatar,
        updatedAt: Date.now(),
      },
      msg,
    );
    v = upsertContact(v, next);
    return v;
  }

  if (msg.type === "friend_accept") {
    if (existing?.status === "pending_out" || existing?.status === "pending_in") {
      v = upsertContact(
        v,
        contactFromMessage(
          {
            ...existing,
            displayName: msg.fromName || existing.displayName,
            status: "mutual",
            updatedAt: Date.now(),
          },
          msg,
        ),
      );
    } else if (!existing) {
      v = upsertContact(
        v,
        contactFromMessage(
          {
            personaId: msg.fromPersonaId,
            publicKey: msg.fromPersonaId,
            displayName: msg.fromName || "Contact",
            status: "mutual",
            updatedAt: Date.now(),
          },
          msg,
        ),
      );
    }
    return v;
  }

  if (msg.type === "room_invite") {
    if (!canExchangeMessages(existing ?? undefined)) return v;
    // Room invite handling wired in a follow-up — requires mutual first.
  }

  return v;
}

export function PersonaContactsProvider({ children }: { children: React.ReactNode }) {
  const { mounted, vault, refreshVault, relayUrl } = useDevice();
  const [localVault, setLocalVault] = useState<DeviceVault>(() => loadVault());
  const inboxRef = useRef<InboxSyncManager | null>(null);

  const refresh = useCallback(() => {
    setLocalVault(loadVault());
    refreshVault();
  }, [refreshVault]);

  const persona = localVault.persona ?? null;
  const contacts = useMemo(() => listContacts(localVault), [localVault]);

  const pendingIncoming = contacts.filter((c) => c.status === "pending_in");
  const pendingOutgoing = contacts.filter((c) => c.status === "pending_out");
  const mutual = contacts.filter((c) => c.status === "mutual");
  const blocked = contacts.filter((c) => c.status === "blocked");

  const myContactCard = persona
    ? encodeContactCard(
        contactCardFromPersona(
          persona.publicKey,
          persona.displayName,
          avatarForContactCard(persona.avatar),
        ),
      )
    : null;

  const handleInboxMessages = useCallback(
    (contactPersonaId: string, messages: InboxMessage[]) => {
      let v = loadVault();
      const cursor = v.inboxCursor?.[contactPersonaId];
      let pastCursor = !cursor;
      let latestId = cursor;
      let changed = false;
      let shouldSendAccept = false;

      for (const msg of messages) {
        if (!pastCursor) {
          if (msg.id === cursor) pastCursor = true;
          continue;
        }
        const before = getContact(v, msg.fromPersonaId);
        const prev = v;
        v = applyIncomingMessage(v, contactPersonaId, msg);
        if (v !== prev) changed = true;
        const after = getContact(v, msg.fromPersonaId);
        if (
          msg.type === "friend_request" &&
          before?.status === "pending_out" &&
          after?.status === "mutual"
        ) {
          shouldSendAccept = true;
        }
        latestId = msg.id;
      }

      if (latestId && latestId !== cursor) {
        v = setInboxCursor(v, contactPersonaId, latestId);
        changed = true;
      }

      if (changed) refresh();

      if (shouldSendAccept && persona && inboxRef.current) {
        const c = getContact(loadVault(), contactPersonaId);
        if (c?.status === "mutual") {
          void inboxRef.current.send(
            c,
            newFriendAccept(persona.personaId, persona.displayName, persona.avatar),
          );
        }
      }
    },
    [persona, refresh],
  );

  useEffect(() => {
    return () => {
      inboxRef.current?.destroy();
      inboxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!persona) {
      inboxRef.current?.destroy();
      inboxRef.current = null;
      return;
    }

    if (!inboxRef.current) {
      inboxRef.current = new InboxSyncManager(persona, relayUrl, handleInboxMessages);
    }

    inboxRef.current.syncContactList(contacts.filter((c) => shouldSyncInbox(c.status)));
  }, [persona, relayUrl, contacts, handleInboxMessages]);

  const createPersona = useCallback(
    async (displayName: string, color: string, avatar: string) => {
      const keys = await generatePersonaKeys();
      const record: PersonaRecord = {
        personaId: keys.personaId,
        publicKey: keys.publicKey,
        privateKeyJwk: keys.privateKeyJwk,
        displayName: displayName.trim() || "You",
        color: color || DEFAULT_ACCENT,
        avatar: avatar.trim() || undefined,
        createdAt: Date.now(),
      };
      savePersona(loadVault(), record);
      refresh();
    },
    [refresh],
  );

  const addContactByCard = useCallback(
    (raw: string): { ok: boolean; error?: string } => {
      if (!persona) return { ok: false, error: "Create your persona first" };
      const card: ContactCard | null = parseContactCard(raw);
      if (!card) return { ok: false, error: "Invalid contact code" };
      if (card.pk === persona.publicKey) return { ok: false, error: "That is your own code" };

      let v = loadVault();
      const existing = getContact(v, card.pk);
      if (existing?.status === "blocked") {
        return { ok: false, error: "Unblock this contact first" };
      }
      if (existing?.status === "mutual") {
        return { ok: false, error: "Already connected" };
      }
      if (existing?.status === "pending_in") {
        return { ok: false, error: "They already requested you — accept instead" };
      }

      const contact: ContactRecord = {
        personaId: card.pk,
        publicKey: card.pk,
        displayName: card.name?.trim() || existing?.displayName || "Contact",
        status: "pending_out",
        avatar: card.avatar,
        updatedAt: Date.now(),
      };
      v = upsertContact(v, contact);
      refresh();

      void (async () => {
        const mgr = inboxRef.current;
        if (!mgr) return;
        await mgr.send(
          contact,
          newFriendRequest(persona.personaId, persona.displayName, persona.avatar),
        );
      })();

      return { ok: true };
    },
    [persona, refresh],
  );

  const acceptContact = useCallback(
    async (personaId: string) => {
      if (!persona) return;
      let v = loadVault();
      const existing = getContact(v, personaId);
      if (!existing || existing.status !== "pending_in") return;

      const updated: ContactRecord = {
        ...existing,
        status: "mutual",
        updatedAt: Date.now(),
      };
      v = upsertContact(v, updated);
      refresh();

      const mgr = inboxRef.current;
      if (mgr) {
        await mgr.send(
          updated,
          newFriendAccept(persona.personaId, persona.displayName, persona.avatar),
        );
      }
    },
    [persona, refresh],
  );

  const blockContact = useCallback(
    (personaId: string) => {
      let v = loadVault();
      const existing = getContact(v, personaId);
      const contact: ContactRecord = existing
        ? { ...existing, status: "blocked", updatedAt: Date.now() }
        : {
            personaId,
            publicKey: personaId,
            displayName: "Blocked",
            status: "blocked",
            updatedAt: Date.now(),
          };
      upsertContact(v, contact);
      refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      persona,
      contacts,
      pendingIncoming,
      pendingOutgoing,
      mutual,
      blocked,
      myContactCard,
      createPersona,
      addContactByCard,
      acceptContact,
      blockContact,
      refresh,
    }),
    [
      persona,
      contacts,
      pendingIncoming,
      pendingOutgoing,
      mutual,
      blocked,
      myContactCard,
      createPersona,
      addContactByCard,
      acceptContact,
      blockContact,
      refresh,
    ],
  );

  if (!mounted) return null;

  if (!persona) {
    return (
      <Ctx.Provider value={value}>
        <PersonaOnboarding onCreate={createPersona} />
      </Ctx.Provider>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePersonaContacts(): PersonaContactsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePersonaContacts must be used within PersonaContactsProvider");
  return ctx;
}
