/**
 * Shared expense-splitting math (used by tripsplit, roomledger).
 * Works on any entry shape with { amountCents, paidById, splitAmongIds }.
 */

export interface SplitEntry {
  /** Integer cents to avoid float drift. */
  amountCents: number;
  paidById: string;
  /** Members the expense is split between. */
  splitAmongIds: string[];
  /**
   * Optional per-member weights (memberId → share count). When present, the
   * expense splits proportionally to these weights instead of equally; a
   * member with no entry defaults to 1 share. Absent ⇒ plain equal split.
   */
  shares?: Record<string, number>;
}

/**
 * Split an amount across members by weight, returning integer cents that sum
 * exactly to `amountCents`. Leftover cents go to the largest fractional
 * remainders (ties broken by member order) — the standard largest-remainder
 * method. With all-equal weights this reproduces a plain equal split.
 */
export function allocateShares(
  amountCents: number,
  memberIds: string[],
  shares?: Record<string, number>,
): Map<string, number> {
  const result = new Map<string, number>();
  if (memberIds.length === 0) return result;

  const weights = memberIds.map((id) => {
    const w = shares?.[id];
    return Number.isFinite(w) && (w as number) > 0 ? (w as number) : 1;
  });
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) return result;

  const parts = memberIds.map((id, i) => {
    const exact = (amountCents * weights[i]) / totalWeight;
    const base = Math.floor(exact);
    return { id, base, frac: exact - base, order: i };
  });

  const allocated = parts.reduce((sum, p) => sum + p.base, 0);
  const remainder = amountCents - allocated; // 0 ≤ remainder < memberIds.length

  const byFrac = [...parts].sort((a, b) => b.frac - a.frac || a.order - b.order);
  for (let k = 0; k < remainder; k++) byFrac[k].base += 1;

  for (const p of parts) result.set(p.id, p.base);
  return result;
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

/** Net balance per member: positive = others owe them, negative = they owe others. */
export function computeBalances(
  expenses: SplitEntry[],
  memberIds: string[],
): MemberBalance[] {
  const nets = new Map(memberIds.map((id) => [id, 0]));

  for (const exp of expenses) {
    const splitters = exp.splitAmongIds.filter((id) => nets.has(id));
    if (splitters.length === 0) continue;

    const owedByMember = allocateShares(exp.amountCents, splitters, exp.shares);

    for (const id of splitters) {
      if (id === exp.paidById) continue;
      const owed = owedByMember.get(id) ?? 0;
      nets.set(id, (nets.get(id) ?? 0) - owed);
      nets.set(exp.paidById, (nets.get(exp.paidById) ?? 0) + owed);
    }
  }

  return memberIds.map((memberId) => ({
    memberId,
    netCents: nets.get(memberId) ?? 0,
  }));
}

/** Greedy debt simplification (Splitwise-style settlement suggestions). */
export function simplifyDebts(balances: MemberBalance[]): SimplifiedDebt[] {
  type Bucket = { id: string; cents: number };
  const creditors: Bucket[] = [];
  const debtors: Bucket[] = [];

  for (const b of balances) {
    if (b.netCents > 0) creditors.push({ id: b.memberId, cents: b.netCents });
    else if (b.netCents < 0) debtors.push({ id: b.memberId, cents: -b.netCents });
  }

  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const debts: SimplifiedDebt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const pay = Math.min(creditors[ci].cents, debtors[di].cents);
    if (pay > 0) {
      debts.push({
        fromId: debtors[di].id,
        toId: creditors[ci].id,
        amountCents: pay,
      });
    }
    creditors[ci].cents -= pay;
    debtors[di].cents -= pay;
    if (creditors[ci].cents === 0) ci++;
    if (debtors[di].cents === 0) di++;
  }

  return debts;
}
