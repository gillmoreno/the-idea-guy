import { Chore, ChoreFrequencyLimit, Completion, FrequencyPeriod } from "./types";

function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekRange(d = new Date()): { start: string; end: string } {
  const day = d.getDay();
  const diffToMon = (day + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: todayStr(start), end: todayStr(end) };
}

export const DEFAULT_FREQUENCY_LIMIT: ChoreFrequencyLimit = {
  maxCompletions: 1,
  period: "day",
};

/** Resolve effective limit — uses frequencyLimit when set, else legacy recurrence. */
export function resolveFrequencyLimit(chore: Chore): ChoreFrequencyLimit | null {
  if (chore.frequencyLimit) {
    if (chore.frequencyLimit.maxCompletions <= 0) return null;
    return chore.frequencyLimit;
  }
  switch (chore.recurrence) {
    case "daily":
      return { maxCompletions: 1, period: "day" };
    case "weekly":
      return { maxCompletions: 1, period: "week" };
    case "one-off":
      return { maxCompletions: 1, period: "ever" };
    case "anytime":
    default:
      return null;
  }
}

export function periodRange(
  period: FrequencyPeriod,
  d = new Date(),
): { start: string; end: string } | null {
  switch (period) {
    case "day": {
      const t = todayStr(d);
      return { start: t, end: t };
    }
    case "week":
      return weekRange(d);
    case "month": {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { start: todayStr(start), end: todayStr(end) };
    }
    case "ever":
      return null;
  }
}

export function completionsCountingTowardLimit(
  completions: Completion[],
  choreId: string,
  memberId: string,
  limit: ChoreFrequencyLimit,
  refDate = new Date(),
): number {
  const range = periodRange(limit.period, refDate);
  return completions.filter(
    (c) =>
      c.choreId === choreId &&
      c.memberId === memberId &&
      c.kind === "reward" &&
      c.status !== "rejected" &&
      (range === null || (c.date >= range.start && c.date <= range.end)),
  ).length;
}

export function canMarkChoreDone(
  chore: Chore,
  memberId: string,
  completions: Completion[],
): { ok: boolean; remaining: number; used: number; limit: ChoreFrequencyLimit | null } {
  const limit = resolveFrequencyLimit(chore);
  if (!limit) {
    return { ok: true, remaining: Infinity, used: 0, limit: null };
  }
  const used = completionsCountingTowardLimit(completions, chore.id, memberId, limit);
  const remaining = Math.max(0, limit.maxCompletions - used);
  return { ok: remaining > 0, remaining, used, limit };
}

export function formatFrequencyLimit(limit: ChoreFrequencyLimit): string {
  if (limit.maxCompletions === 1 && limit.period === "ever") return "Once ever";
  const periodWord =
    limit.period === "day"
      ? "day"
      : limit.period === "week"
        ? "week"
        : limit.period === "month"
          ? "month"
          : "total";
  if (limit.maxCompletions === 1) return `Once per ${periodWord}`;
  return `${limit.maxCompletions}× per ${periodWord}`;
}

export function formatFrequencyStatus(
  limit: ChoreFrequencyLimit,
  used: number,
): string {
  const remaining = Math.max(0, limit.maxCompletions - used);
  if (remaining === 0) {
    if (limit.period === "day") return "Done for today";
    if (limit.period === "week") return "Done for this week";
    if (limit.period === "month") return "Done for this month";
    return "Already done";
  }
  if (limit.maxCompletions === 1) return "";
  return `${used}/${limit.maxCompletions} this ${limit.period === "ever" ? "chore" : limit.period}`;
}
