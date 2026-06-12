import { eventCounts, nextUp } from "@/lib/fairness";

export interface RotaSettings {
  name: string;
  /** Free-text, e.g. "Mon–Fri school run, leaves 8:15". */
  details: string;
  createdAt: number;
}

export interface Driver {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Drive {
  id: string;
  driverId: string;
  at: number;
  note?: string;
  loggedById: string;
}

export const DRIVER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

/** Whose turn: shared fairness rotation over the drive history. */
export function nextDriver(drivers: Driver[], drives: Drive[]): Driver | null {
  return nextUp(
    drivers,
    drives.map((d) => ({ memberId: d.driverId, at: d.at })),
  );
}

export function driveCounts(drivers: Driver[], drives: Drive[]): Map<string, number> {
  return eventCounts(
    drivers,
    drives.map((d) => ({ memberId: d.driverId, at: d.at })),
  );
}
