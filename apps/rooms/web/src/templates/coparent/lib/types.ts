export interface HubSettings {
  /** The kids: "Emma & Noah". */
  kidsLabel: string;
  /** Standing info: school, allergies, doctor. */
  notes: string;
  createdAt: number;
}

export interface Parent {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Stay {
  id: string;
  /** YYYY-MM-DD, first day with this parent. */
  start: string;
  /** YYYY-MM-DD, last day (inclusive). */
  end: string;
  parentId: string;
  note?: string;
  createdAt: number;
}

export interface Update {
  id: string;
  text: string;
  at: number;
  byId: string;
}

/** ÷2 = shared (other parent owes half) · ÷1 = fronted (other parent owes all). */
export type ExpenseSplit = "half" | "full";

export interface KidExpense {
  id: string;
  description: string;
  /** Integer cents to avoid float drift. */
  amountCents: number;
  paidById: string;
  split: ExpenseSplit;
  /** YYYY-MM-DD */
  date: string;
  createdAt: number;
}

export interface MonthSettlement {
  /** Map key is the monthKey (YYYY-MM); one settlement per month. */
  monthKey: string;
  amountCents: number;
  fromId: string;
  toId: string;
  at: number;
  byId: string;
}

export interface MoneyConfig {
  currency: string;
  /** Fixed monthly support transfer; 0 = none configured. */
  supportCents: number;
  supportFromId: string;
  supportToId: string;
}

export const PARENT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

export function staysOverlap(a: Stay, b: Stay): boolean {
  return a.start <= b.end && b.start <= a.end;
}

/** Ids of stays that overlap another stay (both parents claiming the same dates). */
export function overlappingStayIds(stays: Stay[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < stays.length; i++) {
    for (let j = i + 1; j < stays.length; j++) {
      if (staysOverlap(stays[i], stays[j])) {
        ids.add(stays[i].id);
        ids.add(stays[j].id);
      }
    }
  }
  return ids;
}

/** The stay covering a given date, if any (latest created wins on overlap). */
export function stayOn(stays: Stay[], date: string): Stay | null {
  let found: Stay | null = null;
  for (const s of stays) {
    if (s.start <= date && date <= s.end) {
      if (!found || s.createdAt > found.createdAt) found = s;
    }
  }
  return found;
}
