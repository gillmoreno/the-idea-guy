export interface DiarySettings {
  /** Who the diary is for: "Gil", "Mum". */
  patientName: string;
  /** Standing context: conditions, current meds, doctor. */
  notes: string;
  createdAt: number;
}

export interface Observer {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Entry {
  id: string;
  /** What was observed: "headache", "dizzy after lunch". */
  symptom: string;
  /** 1 (mild) – 5 (severe). */
  severity: number;
  note?: string;
  at: number;
  byId: string;
}

export const OBSERVER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

export const SEVERITY_LABELS: Record<number, string> = {
  1: "mild",
  2: "noticeable",
  3: "moderate",
  4: "bad",
  5: "severe",
};

export function severityColor(severity: number): string {
  if (severity >= 5) return "#dc2626";
  if (severity >= 4) return "#ea580c";
  if (severity >= 3) return "#f59e0b";
  if (severity >= 2) return "#84cc16";
  return "#10b981";
}
