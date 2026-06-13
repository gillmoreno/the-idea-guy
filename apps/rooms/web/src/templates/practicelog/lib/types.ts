export interface PracticeSettings {
  /** "Emma's reading" · "Tiago's violin". */
  name: string;
  /** Free-text context: teacher's requirement, current book/piece. */
  details: string;
  /** Weekly minutes goal; 0 = no goal. */
  weeklyGoalMinutes: number;
  createdAt: number;
}

export interface Logger {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Session {
  id: string;
  minutes: number;
  /** What was practiced/read — "ch. 4 of Matilda", "scales + minuet". */
  note?: string;
  at: number;
  byId: string;
}

export const LOGGER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

function dayKey(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Consecutive days with at least one session, ending today or yesterday. */
export function currentStreak(sessions: Session[], now = Date.now()): number {
  const days = new Set(sessions.map((s) => dayKey(s.at)));
  const DAY = 86_400_000;
  let cursor = now;
  // A streak survives until a full day is missed; today not practiced yet ≠ broken.
  if (!days.has(dayKey(cursor))) cursor -= DAY;
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor -= DAY;
  }
  return streak;
}

/** Minutes practiced in the current week (Monday-based). */
export function minutesThisWeek(sessions: Session[], now = Date.now()): number {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day).getTime();
  return sessions
    .filter((s) => s.at >= monday)
    .reduce((sum, s) => sum + s.minutes, 0);
}
