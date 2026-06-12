export interface ClubSettings {
  name: string;
  /** Cadence/rules, e.g. "First Saturday each month · host cooks, guests bring wine". */
  details: string;
  createdAt: number;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Dinner {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  hostId: string;
  theme?: string;
  note?: string;
  createdAt: number;
  loggedById: string;
}

export interface ThemeIdea {
  id: string;
  title: string;
  byId: string;
  createdAt: number;
}

export const MEMBER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];
