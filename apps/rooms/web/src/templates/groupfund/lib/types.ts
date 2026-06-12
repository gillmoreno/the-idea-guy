export interface FundSettings {
  name: string;
  /** What it's for, shown to everyone. */
  details: string;
  /** Target in integer cents; 0 = open-ended fund. */
  targetCents: number;
  currency: string;
  createdAt: number;
}

export interface Saver {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Contribution {
  id: string;
  amountCents: number;
  byId: string;
  note?: string;
  at: number;
}

export const SAVER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

export function totalsBySaver(savers: Saver[], contributions: Contribution[]): Map<string, number> {
  const totals = new Map(savers.map((s) => [s.id, 0]));
  for (const c of contributions) {
    if (totals.has(c.byId)) totals.set(c.byId, (totals.get(c.byId) ?? 0) + c.amountCents);
  }
  return totals;
}
