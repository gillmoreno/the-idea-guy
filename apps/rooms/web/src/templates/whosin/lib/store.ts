import { Y, isYMap } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { EventSettings, Occurrence, Player, Rsvp, RsvpStatus } from "./types";

export const WHOSIN_TEMPLATE_ID = "whosin";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class WhosInStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readEventMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, WHOSIN_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "event") : null;
  }

  private readPlayersMap(): Y.Map<Player> | null {
    const pub = readTemplateBranch(this.publicDoc, WHOSIN_TEMPLATE_ID);
    return pub ? readNestedMap<Player>(pub, "players") : null;
  }

  private readOccurrencesMap(): Y.Map<Occurrence> | null {
    const pub = readTemplateBranch(this.publicDoc, WHOSIN_TEMPLATE_ID);
    return pub ? readNestedMap<Occurrence>(pub, "occurrences") : null;
  }

  private readRsvpBucket(occurrenceId: string): Y.Map<Rsvp> | null {
    const pub = readTemplateBranch(this.publicDoc, WHOSIN_TEMPLATE_ID);
    if (!pub) return null;
    const rsvps = readNestedMap(pub, "rsvps");
    if (!rsvps) return null;
    const bucket = rsvps.get(occurrenceId);
    return isYMap(bucket) ? (bucket as Y.Map<Rsvp>) : null;
  }

  isInitialized(): boolean {
    const event = this.readEventMap();
    return typeof event?.get("name") === "string";
  }

  getEvent(): EventSettings | null {
    const event = this.readEventMap();
    const name = event?.get("name");
    if (typeof name !== "string") return null;
    const capacity = event?.get("capacity");
    return {
      name,
      details: (event?.get("details") as string) ?? "",
      capacity: typeof capacity === "number" && capacity > 0 ? capacity : undefined,
      createdAt: (event?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initEvent(settings: { name: string; details: string; capacity?: number }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: WHOSIN_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, WHOSIN_TEMPLATE_ID);
      const event = ensureNestedMap(pub, "event");
      event.set("name", settings.name.trim());
      event.set("details", settings.details.trim());
      if (settings.capacity && settings.capacity > 0) event.set("capacity", settings.capacity);
      event.set("createdAt", Date.now());
      ensureNestedMap<Player>(pub, "players");
      ensureNestedMap<Occurrence>(pub, "occurrences");
      ensureNestedMap(pub, "rsvps");
    });
  }

  listPlayers(): Player[] {
    const players = this.readPlayersMap();
    if (!players) return [];
    return [...players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getPlayer(id: string): Player | null {
    return this.readPlayersMap()?.get(id) ?? null;
  }

  addPlayer(input: { name: string; color: string; id?: string }): Player {
    const player: Player = {
      id: input.id ?? uid("p_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, WHOSIN_TEMPLATE_ID);
      const players = ensureNestedMap<Player>(pub, "players");
      players.set(player.id, player);
    });
    return player;
  }

  /** All occurrences sorted by date ascending. */
  listOccurrences(): Occurrence[] {
    const occurrences = this.readOccurrencesMap();
    if (!occurrences) return [];
    return [...occurrences.values()].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      return dateCmp !== 0 ? dateCmp : a.createdAt - b.createdAt;
    });
  }

  addOccurrence(input: { date: string; note?: string; createdById: string }): Occurrence {
    const occurrence: Occurrence = {
      id: uid("o_"),
      date: input.date,
      note: input.note?.trim() || undefined,
      createdAt: Date.now(),
      createdById: input.createdById,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, WHOSIN_TEMPLATE_ID);
      const occurrences = ensureNestedMap<Occurrence>(pub, "occurrences");
      occurrences.set(occurrence.id, occurrence);
    });
    return occurrence;
  }

  /** RSVPs for one occurrence, keyed by player id. */
  getRsvps(occurrenceId: string): Map<string, Rsvp> {
    const bucket = this.readRsvpBucket(occurrenceId);
    if (!bucket) return new Map();
    const out = new Map<string, Rsvp>();
    bucket.forEach((rsvp, playerId) => out.set(playerId, rsvp));
    return out;
  }

  setRsvp(occurrenceId: string, playerId: string, status: RsvpStatus) {
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, WHOSIN_TEMPLATE_ID);
      const rsvps = ensureNestedMap(pub, "rsvps");
      let bucket = rsvps.get(occurrenceId);
      if (!isYMap(bucket)) {
        bucket = new Y.Map();
        rsvps.set(occurrenceId, bucket);
      }
      const b = bucket as Y.Map<Rsvp>;
      const existing = b.get(playerId);
      // Keep the original response time when only the status changes — waitlist
      // order stays first-come even if someone flips maybe → in.
      b.set(playerId, { status, at: existing?.at ?? Date.now() });
    });
  }
}
