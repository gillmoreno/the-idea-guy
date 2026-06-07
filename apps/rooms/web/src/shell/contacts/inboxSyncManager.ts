import {
  LocalFirstDoc,
  derivePairInboxKeyMaterial,
  pairRoomCode,
  type ContactRecord,
  type InboxMessage,
  type PersonaRecord,
} from "@the-idea-guy/room-kit";
import { appendInboxMessage, listInboxMessages } from "./pairInboxDoc";

const INBOX_APP_ID = "rooms-inbox";

type OnMessages = (contactPersonaId: string, messages: InboxMessage[]) => void;

export class InboxSyncManager {
  private docs = new Map<string, LocalFirstDoc>();
  private destroyed = false;

  constructor(
    private readonly persona: PersonaRecord,
    private readonly relayUrl: string,
    private readonly onMessages: OnMessages,
  ) {}

  syncContactList(contacts: ContactRecord[]) {
    if (this.destroyed) return;

    const active = new Set<string>();
    for (const c of contacts) {
      if (c.status === "blocked") {
        this.closeOne(c.personaId);
        continue;
      }
      if (c.status !== "pending_out" && c.status !== "pending_in" && c.status !== "mutual") {
        continue;
      }
      active.add(c.personaId);
      this.ensure(c);
    }

    for (const id of this.docs.keys()) {
      if (!active.has(id)) this.closeOne(id);
    }
  }

  async send(contact: ContactRecord, message: InboxMessage): Promise<void> {
    const doc = await this.ensure(contact);
    appendInboxMessage(doc.doc, message);
  }

  private ensure(contact: ContactRecord): Promise<LocalFirstDoc> {
    const existing = this.docs.get(contact.personaId);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve) => {
      void derivePairInboxKeyMaterial(this.persona.privateKeyJwk, contact.publicKey).then(
        (keyMaterial) => {
          const roomCode = pairRoomCode(this.persona.publicKey, contact.publicKey);
          const doc = new LocalFirstDoc({
            appId: INBOX_APP_ID,
            keyMaterial,
            roomCode,
            scope: "public",
            relayUrl: this.relayUrl,
            onChange: () => {
              const messages = listInboxMessages(doc.doc);
              if (messages.length) this.onMessages(contact.personaId, messages);
            },
          });
          this.docs.set(contact.personaId, doc);
          resolve(doc);
        },
      );
    });
  }

  private closeOne(personaId: string) {
    const doc = this.docs.get(personaId);
    if (doc) {
      doc.destroy();
      this.docs.delete(personaId);
    }
  }

  destroy() {
    this.destroyed = true;
    for (const id of [...this.docs.keys()]) this.closeOne(id);
  }
}
