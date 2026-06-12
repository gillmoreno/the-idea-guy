/**
 * Monthly close math for the kid-expenses ledger. Mirrors the spreadsheet ritual:
 * each parent's column sums what the OTHER owes them (÷2 → half, ÷1 → all),
 * the difference is the expenses net, and the fixed monthly support transfer is
 * laid on top — producing one final number: "X pays Y this month."
 */

import type { KidExpense, MoneyConfig } from "./types";

export function monthKeyOf(date: string): string {
  return date.slice(0, 7);
}

export function monthLabelOf(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** What the other parent owes the payer for this line. */
export function countedCents(expense: Pick<KidExpense, "amountCents" | "split">): number {
  return expense.split === "half" ? Math.round(expense.amountCents / 2) : expense.amountCents;
}

export interface MonthClose {
  /** Sum of counted cents per payer id. */
  totals: Map<string, number>;
  /** Expenses net: positive → partyB owes partyA `netCents`. */
  netCents: number;
  /** Final transfer after support; null when perfectly even. */
  final: { fromId: string; toId: string; amountCents: number } | null;
}

/**
 * Close a month between two parties. `expenses` must already be filtered to the
 * month; entries paid by anyone other than the two parties are ignored.
 */
export function closeMonth(
  expenses: KidExpense[],
  partyAId: string,
  partyBId: string,
  config: Pick<MoneyConfig, "supportCents" | "supportFromId" | "supportToId">,
): MonthClose {
  const totals = new Map<string, number>([
    [partyAId, 0],
    [partyBId, 0],
  ]);
  for (const e of expenses) {
    if (!totals.has(e.paidById)) continue;
    totals.set(e.paidById, (totals.get(e.paidById) ?? 0) + countedCents(e));
  }

  // B owes A what A laid out, and vice versa.
  let owedByBtoA = (totals.get(partyAId) ?? 0) - (totals.get(partyBId) ?? 0);
  const netCents = owedByBtoA;

  if (config.supportCents > 0) {
    if (config.supportFromId === partyBId && config.supportToId === partyAId) {
      owedByBtoA += config.supportCents;
    } else if (config.supportFromId === partyAId && config.supportToId === partyBId) {
      owedByBtoA -= config.supportCents;
    }
  }

  let final: MonthClose["final"] = null;
  if (owedByBtoA > 0) final = { fromId: partyBId, toId: partyAId, amountCents: owedByBtoA };
  else if (owedByBtoA < 0) final = { fromId: partyAId, toId: partyBId, amountCents: -owedByBtoA };

  return { totals, netCents, final };
}
