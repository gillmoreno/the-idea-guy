export interface CircleSettings {
  /** Who's being cared for: "Mum", "Grandpa Joe". */
  recipientName: string;
  notes: string;
  createdAt: number;
}

export interface Carer {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Visit {
  id: string;
  carerId: string;
  at: number;
  note?: string;
}

export interface Note {
  id: string;
  text: string;
  at: number;
  byId: string;
}

export const CARER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];
