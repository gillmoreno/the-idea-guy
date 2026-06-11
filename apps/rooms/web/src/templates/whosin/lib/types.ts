export interface EventSettings {
  name: string;
  /** Free-text cadence/location hint, e.g. "Every Sunday 10:00, Riverside pitch". */
  details: string;
  /** Optional max spots; RSVPs beyond this go to the waitlist (first come, first served). */
  capacity?: number;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Occurrence {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  note?: string;
  createdAt: number;
  createdById: string;
}

export type RsvpStatus = "in" | "maybe" | "out";

export interface Rsvp {
  status: RsvpStatus;
  at: number;
}

export const PLAYER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];
