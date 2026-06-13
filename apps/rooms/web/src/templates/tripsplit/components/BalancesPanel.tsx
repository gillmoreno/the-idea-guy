"use client";

import { formatMoney } from "@/templates/choreboard/lib/format";
import { computeBalances, simplifyDebts } from "../lib/balances";
import type { Expense, Traveler } from "../lib/types";
import { MoneyCents } from "./ui";
import { Avatar } from "@/components/kit";

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
      <div className="card stack">
        <div className="section-title">Trip total</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>
          {formatMoney(totalSpentCents / 100, currency)}
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Across {expenses.length} expense{expenses.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="section-title">Balances</div>
      {balances.every((b) => b.netCents === 0) ? (
        <div className="empty">Everyone is settled up.</div>
      ) : (
        <div className="stack-sm">
          {balances
            .filter((b) => b.netCents !== 0)
            .map((b) => {
              const t = byId.get(b.memberId);
              if (!t) return null;
              return (
                <div key={b.memberId} className="card row gap-sm">
                  <Avatar person={t} />
                  <div style={{ flex: 1 }}>
                    <strong>{t.name}</strong>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {b.netCents > 0 ? "gets back" : "owes"}
                    </div>
                  </div>
                  <MoneyCents cents={Math.abs(b.netCents)} currency={currency} />
                </div>
              );
            })}
        </div>
      )}

      {debts.length > 0 && (
        <>
          <div className="section-title">Settle up</div>
          <p className="muted" style={{ fontSize: 13 }}>
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
                    <MoneyCents cents={d.amountCents} currency={currency} />
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
