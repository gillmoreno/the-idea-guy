"use client";

import { formatMoney } from "@/lib/format";
import {
  computeBalances,
  simplifyDebts,
  type SplitEntry,
} from "@/lib/splitMath";
import { Avatar, EmptyState, MoneyAmount, RecordRow, StatCard } from "@/components/kit";
import type { FeatureDef, SchemaRecord } from "@/schema/types";
import { useSchemaStore } from "@/schema/useSchemaStore";

type BalanceFeature = Extract<FeatureDef, { type: "balance" }>;

function asString(record: SchemaRecord, key: string): string {
  const v = record.fields[key];
  if (Array.isArray(v)) return v.join(",");
  return typeof v === "string" ? v : "";
}

function asIds(record: SchemaRecord, key: string): string[] {
  const v = record.fields[key];
  if (Array.isArray(v)) return v.filter(Boolean);
  return typeof v === "string" && v
    ? v.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
}

/**
 * BalancePanel — the declarative engine's "settle up" view, driven by a `balance`
 * feature. Reads the collection's records, maps the configured fields (amount /
 * paidBy / splitAmong) into the shared `splitMath`, and renders the trip total,
 * per-member balances, and minimum settle-up transfers — the same layout the
 * bespoke tripsplit BalancesPanel uses, now generic over any expense collection.
 */
export function BalancePanel({
  feature,
  currency,
}: {
  feature: BalanceFeature;
  currency: string;
}) {
  const store = useSchemaStore();
  if (!store) return null;

  const members = store.listMembers();
  const byId = new Map(members.map((m) => [m.id, m]));
  const memberIds = members.map((m) => m.id);

  const f = feature.fields;
  const expenses: SplitEntry[] = store
    .listRecords(feature.collection)
    .map((r) => ({
      amountCents: Math.round((Number.parseFloat(asString(r, f.amount)) || 0) * 100),
      paidById: asString(r, f.paidBy),
      splitAmongIds: asIds(r, f.splitAmong),
    }))
    .filter((e) => e.amountCents > 0 && e.paidById && e.splitAmongIds.length > 0);

  const balances = computeBalances(expenses, memberIds);
  const debts = simplifyDebts(balances);
  const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  return (
    <div className="stack">
      <StatCard
        label="Total"
        value={formatMoney(totalCents / 100, currency)}
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
              const m = byId.get(b.memberId);
              if (!m) return null;
              return (
                <RecordRow
                  key={b.memberId}
                  leading={<Avatar person={m} />}
                  title={m.name}
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
            Minimum transfers to balance the group. Pay outside the app (cash, transfer, etc.).
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
