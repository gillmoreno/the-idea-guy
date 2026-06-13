"use client";

import { formatMoney } from "@/templates/choreboard/lib/format";
import { computeBalances, simplifyDebts } from "../lib/balances";
import type { Expense, Traveler } from "../lib/types";
import { Avatar, EmptyState, MoneyAmount, RecordRow, StatCard } from "@/components/kit";

export function BalancesPanel({
  travelers,
  expenses,
  currency,
}: {
  travelers: Traveler[];
  expenses: Expense[];
  currency: string;
}) {
  const byId = new Map(travelers.map((t) => [t.id, t]));
  const memberIds = travelers.map((t) => t.id);
  const balances = computeBalances(expenses, memberIds);
  const debts = simplifyDebts(balances);

  const totalSpentCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  return (
    <div className="stack">
      <StatCard
        label="Trip total"
        value={formatMoney(totalSpentCents / 100, currency)}
        sub={`Across ${expenses.length} expense${expenses.length === 1 ? "" : "s"}`}
      />

      <div className="section-title">Balances</div>
      {balances.every((b) => b.netCents === 0) ? (
        <EmptyState>Everyone is settled up.</EmptyState>
      ) : (
        <div className="stack-sm">
          {balances
            .filter((b) => b.netCents !== 0)
            .map((b) => {
              const t = byId.get(b.memberId);
              if (!t) return null;
              return (
                <RecordRow
                  key={b.memberId}
                  leading={<Avatar person={t} />}
                  title={t.name}
                  meta={b.netCents > 0 ? "gets back" : "owes"}
                  trailing={<MoneyAmount cents={b.netCents} currency={currency} />}
                />
              );
            })}
        </div>
      )}

      {debts.length > 0 && (
        <>
          <div className="section-title">Settle up</div>
          <p className="meta-line">
            Minimum transfers to balance the group. Pay outside the app (Venmo, cash, etc.).
          </p>
          <div className="stack-sm">
            {debts.map((d, i) => {
              const from = byId.get(d.fromId);
              const to = byId.get(d.toId);
              if (!from || !to) return null;
              return (
                <div key={i} className="card">
                  <strong>{from.name}</strong>
                  <span className="muted"> owes </span>
                  <strong>{to.name}</strong>
                  <div style={{ marginTop: 4 }}>
                    <MoneyAmount cents={d.amountCents} currency={currency} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
