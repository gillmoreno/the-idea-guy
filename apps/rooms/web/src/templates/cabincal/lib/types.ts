export interface PlaceSettings {
  name: string;
  /** Free-text, e.g. "Key in the lockbox, code 4521 · no pets". */
  details: string;
  createdAt: number;
}

export interface Owner {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Booking {
  id: string;
  /** YYYY-MM-DD, first night. */
  start: string;
  /** YYYY-MM-DD, last night (inclusive). */
  end: string;
  ownerId: string;
  note?: string;
  createdAt: number;
}

export const OWNER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

/** Nights in a booking: both start and end are nights stayed (inclusive). */
export function bookingNights(b: Booking): number {
  const ms = new Date(b.end).getTime() - new Date(b.start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function bookingsOverlap(a: Booking, b: Booking): boolean {
  return a.start <= b.end && b.start <= a.end;
}

/** Ids of bookings that overlap at least one other booking. */
export function overlappingIds(bookings: Booking[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      if (bookingsOverlap(bookings[i], bookings[j])) {
        ids.add(bookings[i].id);
        ids.add(bookings[j].id);
      }
    }
  }
  return ids;
}

export function nightsByOwner(owners: Owner[], bookings: Booking[]): Map<string, number> {
  const nights = new Map(owners.map((o) => [o.id, 0]));
  for (const b of bookings) {
    if (nights.has(b.ownerId)) {
      nights.set(b.ownerId, (nights.get(b.ownerId) ?? 0) + bookingNights(b));
    }
  }
  return nights;
}
