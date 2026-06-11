/**
 * Shared expense-splitting math (used by tripsplit, roomledger).
 * Works on any entry shape with { amountCents, paidById, splitAmongIds }.
 */

export interface SplitEntry {
  /** Integer cents to avoid float drift. */
  amountCents: number;
  paidById: string;
  /** Equal split among these member ids. */
  splitAmongIds: string[];
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

    const share = Math.floor(exp.amountCents / splitters.length);
    let remainder = exp.amountCents - share * splitters.length;

    for (const id of splitters) {
      if (id === exp.paidById) continue;
      let owed = share;
      if (remainder > 0) {
        owed += 1;
        remainder -= 1;
      }
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
