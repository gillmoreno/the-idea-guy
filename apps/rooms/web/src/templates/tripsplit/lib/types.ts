export interface TripSettings {
  name: string;
  currency: string;
  createdAt: number;
}

export interface Traveler {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Expense {
  id: string;
  description: string;
  /** Stored as integer cents to avoid float drift. */
  amountCents: number;
  paidById: string;
  /** Equal split among these traveler ids. */
  splitAmongIds: string[];
  date: string;
  createdAt: number;
  createdById: string;
}

export interface MemberBalance {
  memberId: string;
  netCents: number;
}

export interface SimplifiedDebt {
  fromId: string;
  toId: string;
  amountCents: number;
}

export const TRAVELER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];
