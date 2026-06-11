import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { HouseSettings, LedgerEntry, Roommate } from "./types";

export const ROOMLEDGER_TEMPLATE_ID = "roomledger";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class RoomLedgerStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readHouseMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, ROOMLEDGER_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "house") : null;
  }

  private readRoommatesMap(): Y.Map<Roommate> | null {
    const pub = readTemplateBranch(this.publicDoc, ROOMLEDGER_TEMPLATE_ID);
    return pub ? readNestedMap<Roommate>(pub, "roommates") : null;
  }

  private readEntriesMap(): Y.Map<LedgerEntry> | null {
    const pub = readTemplateBranch(this.publicDoc, ROOMLEDGER_TEMPLATE_ID);
    return pub ? readNestedMap<LedgerEntry>(pub, "entries") : null;
  }

  isInitialized(): boolean {
    const house = this.readHouseMap();
    return typeof house?.get("name") === "string";
  }

  getHouse(): HouseSettings | null {
    const house = this.readHouseMap();
    const name = house?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      currency: (house?.get("currency") as string) ?? "USD",
      createdAt: (house?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initHouse(settings: { name: string; currency: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: ROOMLEDGER_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, ROOMLEDGER_TEMPLATE_ID);
      const house = ensureNestedMap(pub, "house");
      house.set("name", settings.name.trim());
      house.set("currency", settings.currency);
      house.set("createdAt", Date.now());
      ensureNestedMap<Roommate>(pub, "roommates");
      ensureNestedMap<LedgerEntry>(pub, "entries");
    });
  }

  listRoommates(): Roommate[] {
    const roommates = this.readRoommatesMap();
    if (!roommates) return [];
    return [...roommates.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getRoommate(id: string): Roommate | null {
    return this.readRoommatesMap()?.get(id) ?? null;
  }

  addRoommate(input: { name: string; color: string; id?: string }): Roommate {
    const roommate: Roommate = {
      id: input.id ?? uid("rm_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, ROOMLEDGER_TEMPLATE_ID);
      const roommates = ensureNestedMap<Roommate>(pub, "roommates");
      roommates.set(roommate.id, roommate);
    });
    return roommate;
  }

  listEntries(): LedgerEntry[] {
    const entries = this.readEntriesMap();
    if (!entries) return [];
    return [...entries.values()].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      return dateCmp !== 0 ? dateCmp : b.createdAt - a.createdAt;
    });
  }

  addExpense(input: {
    description: string;
    amountCents: number;
    paidById: string;
    splitAmongIds: string[];
    category?: string;
    date?: string;
    createdById: string;
  }): LedgerEntry {
    const entry: LedgerEntry = {
      id: uid("le_"),
      kind: "expense",
      description: input.description.trim(),
      amountCents: input.amountCents,
      paidById: input.paidById,
      splitAmongIds: [...input.splitAmongIds],
      category: input.category,
      date: input.date ?? todayStr(),
      createdAt: Date.now(),
      createdById: input.createdById,
    };
    this.writeEntry(entry);
    return entry;
  }

  /** Record that `fromId` paid `toId` outside the app — offsets their balances. */
  addSettlement(input: {
    fromId: string;
    toId: string;
    amountCents: number;
    createdById: string;
  }): LedgerEntry {
    const entry: LedgerEntry = {
      id: uid("le_"),
      kind: "settlement",
      description: "Settle-up",
      amountCents: input.amountCents,
      paidById: input.fromId,
      splitAmongIds: [input.toId],
      date: todayStr(),
      createdAt: Date.now(),
      createdById: input.createdById,
    };
    this.writeEntry(entry);
    return entry;
  }

  removeEntry(id: string) {
    this.publicDoc.transact(() => {
      this.readEntriesMap()?.delete(id);
    });
  }

  private writeEntry(entry: LedgerEntry) {
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, ROOMLEDGER_TEMPLATE_ID);
      const entries = ensureNestedMap<LedgerEntry>(pub, "entries");
      entries.set(entry.id, entry);
    });
  }
}
