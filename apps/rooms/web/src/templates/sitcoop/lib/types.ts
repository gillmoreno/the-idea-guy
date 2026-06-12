export interface CoopSettings {
  name: string;
  details: string;
  createdAt: number;
}

export interface Family {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Sit {
  id: string;
  /** Who did the sitting (earns the time). */
  sitterId: string;
  /** Whose kids were watched (spends the time). */
  forId: string;
  /** Integer minutes — no float drift. */
  minutes: number;
  /** YYYY-MM-DD */
  date: string;
  note?: string;
  createdAt: number;
  loggedById: string;
}

export const FAMILY_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

/** Net minutes per family: positive = banked hours, negative = owed hours. */
export function minuteBalances(families: Family[], sits: Sit[]): Map<string, number> {
  const balances = new Map(families.map((f) => [f.id, 0]));
  for (const sit of sits) {
    if (balances.has(sit.sitterId)) {
      balances.set(sit.sitterId, (balances.get(sit.sitterId) ?? 0) + sit.minutes);
    }
    if (balances.has(sit.forId)) {
      balances.set(sit.forId, (balances.get(sit.forId) ?? 0) - sit.minutes);
    }
  }
  return balances;
}

export function formatHours(minutes: number): string {
  const sign = minutes < 0 ? "−" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

export function parseHoursToMinutes(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0 || n > 24) return null;
  return Math.round(n * 60);
}
