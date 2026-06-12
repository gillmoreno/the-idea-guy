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

/**
 * Whose turn: fewest drives wins; ties go to whoever drove longest ago
 * (never-driven counts as longest ago, ordered by join time).
 */
export function nextDriver(drivers: Driver[], drives: Drive[]): Driver | null {
  if (drivers.length === 0) return null;
  const counts = new Map(drivers.map((d) => [d.id, 0]));
  const lastAt = new Map<string, number>();
  for (const drive of drives) {
    if (!counts.has(drive.driverId)) continue;
    counts.set(drive.driverId, (counts.get(drive.driverId) ?? 0) + 1);
    lastAt.set(drive.driverId, Math.max(lastAt.get(drive.driverId) ?? 0, drive.at));
  }
  return [...drivers].sort((a, b) => {
    const countDiff = (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    const lastDiff = (lastAt.get(a.id) ?? 0) - (lastAt.get(b.id) ?? 0);
    if (lastDiff !== 0) return lastDiff;
    return a.joinedAt - b.joinedAt;
  })[0];
}

export function driveCounts(drivers: Driver[], drives: Drive[]): Map<string, number> {
  const counts = new Map(drivers.map((d) => [d.id, 0]));
  for (const drive of drives) {
    if (counts.has(drive.driverId)) {
      counts.set(drive.driverId, (counts.get(drive.driverId) ?? 0) + 1);
    }
  }
  return counts;
}
