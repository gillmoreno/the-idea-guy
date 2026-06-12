import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { Booking, Owner, PlaceSettings } from "./types";

export const CABINCAL_TEMPLATE_ID = "cabincal";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class CabinCalStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readPlaceMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, CABINCAL_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "place") : null;
  }

  private readOwnersMap(): Y.Map<Owner> | null {
    const pub = readTemplateBranch(this.publicDoc, CABINCAL_TEMPLATE_ID);
    return pub ? readNestedMap<Owner>(pub, "owners") : null;
  }

  private readBookingsMap(): Y.Map<Booking> | null {
    const pub = readTemplateBranch(this.publicDoc, CABINCAL_TEMPLATE_ID);
    return pub ? readNestedMap<Booking>(pub, "bookings") : null;
  }

  isInitialized(): boolean {
    const place = this.readPlaceMap();
    return typeof place?.get("name") === "string";
  }

  getPlace(): PlaceSettings | null {
    const place = this.readPlaceMap();
    const name = place?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      details: (place?.get("details") as string) ?? "",
      createdAt: (place?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initPlace(settings: { name: string; details: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: CABINCAL_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, CABINCAL_TEMPLATE_ID);
      const place = ensureNestedMap(pub, "place");
      place.set("name", settings.name.trim());
      place.set("details", settings.details.trim());
      place.set("createdAt", Date.now());
      ensureNestedMap<Owner>(pub, "owners");
      ensureNestedMap<Booking>(pub, "bookings");
    });
  }

  listOwners(): Owner[] {
    const owners = this.readOwnersMap();
    if (!owners) return [];
    return [...owners.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getOwner(id: string): Owner | null {
    return this.readOwnersMap()?.get(id) ?? null;
  }

  addOwner(input: { name: string; color: string; id?: string }): Owner {
    const owner: Owner = {
      id: input.id ?? uid("ow_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CABINCAL_TEMPLATE_ID);
      const owners = ensureNestedMap<Owner>(pub, "owners");
      owners.set(owner.id, owner);
    });
    return owner;
  }

  /** All bookings sorted by start date ascending. */
  listBookings(): Booking[] {
    const bookings = this.readBookingsMap();
    if (!bookings) return [];
    return [...bookings.values()].sort((a, b) => {
      const startCmp = a.start.localeCompare(b.start);
      return startCmp !== 0 ? startCmp : a.createdAt - b.createdAt;
    });
  }

  addBooking(input: { start: string; end: string; ownerId: string; note?: string }): Booking {
    const booking: Booking = {
      id: uid("bk_"),
      start: input.start,
      end: input.end,
      ownerId: input.ownerId,
      note: input.note?.trim() || undefined,
      createdAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CABINCAL_TEMPLATE_ID);
      const bookings = ensureNestedMap<Booking>(pub, "bookings");
      bookings.set(booking.id, booking);
    });
    return booking;
  }

  removeBooking(id: string) {
    this.publicDoc.transact(() => {
      this.readBookingsMap()?.delete(id);
    });
  }
}
