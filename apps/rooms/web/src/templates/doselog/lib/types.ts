export interface CareSettings {
  /** Who the doses are for: "Max", "Grandma", "Biscuit the cat". */
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

export interface Med {
  id: string;
  name: string;
  /** e.g. "5 ml", "1 tablet" */
  doseLabel: string;
  /** e.g. "morning & evening", "every 6h as needed" */
  scheduleLabel: string;
  /** Warn when logging again within this many hours (0/undefined = no warning). */
  minIntervalHours?: number;
  createdAt: number;
  createdById: string;
}

export interface DoseEvent {
  id: string;
  medId: string;
  /** Snapshot so history survives med deletion/rename. */
  medName: string;
  at: number;
  byId: string;
  note?: string;
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
