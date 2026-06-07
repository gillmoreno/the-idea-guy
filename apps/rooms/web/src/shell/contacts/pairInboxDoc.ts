import { Y, isYMap } from "@the-idea-guy/room-kit";
import type { InboxMessage } from "@the-idea-guy/room-kit";
import { parseInboxMessage } from "@the-idea-guy/room-kit";

const MSGS_KEY = "messages";

function messagesMap(doc: Y.Doc): Y.Map<string> | null {
  const root = doc.getMap("pair");
  const m = root.get(MSGS_KEY);
  return isYMap(m) ? (m as Y.Map<string>) : null;
}

export function listInboxMessages(doc: Y.Doc): InboxMessage[] {
  const map = messagesMap(doc);
  if (!map) return [];
  const out: InboxMessage[] = [];
  for (const raw of map.values()) {
    if (typeof raw !== "string") continue;
    const msg = parseInboxMessage(raw);
    if (msg) out.push(msg);
  }
  return out.sort((a, b) => a.sentAt - b.sentAt);
}

export function appendInboxMessage(doc: Y.Doc, message: InboxMessage): void {
  doc.transact(() => {
    const root = doc.getMap("pair");
    let map = root.get(MSGS_KEY);
    if (!isYMap(map)) {
      map = new Y.Map();
      root.set(MSGS_KEY, map);
    }
    (map as Y.Map<string>).set(message.id, JSON.stringify(message));
  });
}
