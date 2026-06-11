export interface HouseSettings {
  name: string;
  currency: string;
  createdAt: number;
}

export interface Roommate {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Groceries",
  "Household",
  "Fun",
  "Other",
] as const;

export type LedgerEntryKind = "expense" | "settlement";

export interface LedgerEntry {
  id: string;
  kind: LedgerEntryKind;
  description: string;
  /** Stored as integer cents to avoid float drift. */
  amountCents: number;
  paidById: string;
  /** Equal split among these roommate ids. For settlements: the single recipient. */
  splitAmongIds: string[];
  category?: string;
  date: string;
  createdAt: number;
  createdById: string;
}

export const ROOMMATE_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];
