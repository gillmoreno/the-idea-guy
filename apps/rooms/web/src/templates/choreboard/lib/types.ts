export type Role = "parent" | "kid";

export type Difficulty = "very-easy" | "easy" | "medium" | "hard" | "tough";

export type Category =
  | "bedroom"
  | "bathroom"
  | "laundry"
  | "kitchen"
  | "living-room"
  | "general";

export type Recurrence = "anytime" | "daily" | "weekly" | "one-off";

export type FrequencyPeriod = "day" | "week" | "month" | "ever";

/** How many times a kid may mark a chore done per period. maxCompletions 0 = unlimited. */
export interface ChoreFrequencyLimit {
  maxCompletions: number;
  period: FrequencyPeriod;
}

export type ChoreStatus = "active" | "proposed" | "archived";

export type CompletionKind = "reward" | "penalty";

export type CompletionStatus = "pending" | "approved" | "rejected" | "paid";

export interface Family {
  name: string;
  currency: string; // ISO 4217, e.g. "USD"
  paydayWeekday: number; // 0 = Sunday ... 6 = Saturday
  createdAt: number;
}

/** Parent-configurable kid capabilities (synced on public channel for kid UIs). */
export interface KidPermissions {
  seeChoreRewards: boolean;
  seeOwnBalance: boolean;
  seePendingBalance: boolean;
  seeWeekEarnings: boolean;
  seeSiblingBalances: boolean;
  canMarkDone: boolean;
  canProposeChores: boolean;
  seeActivityHistory: boolean;
}

export interface Member {
  id: string;
  name: string;
  role: Role;
  color: string;
  pin?: string;
  createdAt: number;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  reward: number; // one price per chore, same for every kid
  recurrence: Recurrence;
  /** When set, caps how often kids can mark this chore done. Default for new chores: 1/day. */
  frequencyLimit?: ChoreFrequencyLimit;
  requiresApproval: boolean;
  status: ChoreStatus;
  proposedBy?: string; // member id when a kid suggested it
  createdAt: number;
}

export interface Completion {
  id: string;
  choreId?: string; // absent for ad-hoc penalties/adjustments
  label: string; // snapshot of chore title (or penalty reason)
  memberId: string;
  date: string; // YYYY-MM-DD (local)
  kind: CompletionKind;
  status: CompletionStatus;
  amount: number; // signed: + reward, - penalty (snapshot at completion)
  note?: string;
  approvedBy?: string;
  /** HMAC from member device secret — parent can verify before approving */
  sig?: string;
  createdAt: number;
}

/** Kid proposals live on the public doc; parent promotes to admin chores */
export interface ChoreProposal {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  reward: number;
  proposedBy: string;
  createdAt: number;
}

export interface Payment {
  id: string;
  memberId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  total: number;
  completionIds: string[];
  paidDate: string; // YYYY-MM-DD
  createdAt: number;
}

export const DIFFICULTY_META: Record<Difficulty, { label: string; order: number }> = {
  "very-easy": { label: "Very easy", order: 0 },
  easy: { label: "Easy", order: 1 },
  medium: { label: "Medium", order: 2 },
  hard: { label: "Hard", order: 3 },
  tough: { label: "Tough", order: 4 },
};

export const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  bedroom: { label: "Bedroom", emoji: "🛏️" },
  bathroom: { label: "Bathroom", emoji: "🛁" },
  laundry: { label: "Laundry", emoji: "🧺" },
  kitchen: { label: "Kitchen", emoji: "🍽️" },
  "living-room": { label: "Living room", emoji: "🛋️" },
  general: { label: "General", emoji: "✨" },
};

export const MEMBER_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];
