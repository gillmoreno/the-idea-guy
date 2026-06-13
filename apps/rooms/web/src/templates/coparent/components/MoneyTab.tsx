"use client";

import { useState } from "react";
import { CURRENCY_OPTIONS, formatDate, formatMoney } from "@/lib/format";
import { formatRelativeTime } from "@/lib/relativeTime";
import type { ExpenseSplit, Parent } from "../lib/types";
import {
  closeMonth,
  countedCents,
  monthKeyOf,
  monthLabelOf,
  shiftMonthKey,
} from "../lib/money";
import { todayStr } from "../lib/store";
import { useCoParentStore } from "../lib/useCoParentStore";
import { EmptyState, Avatar, RecordRow } from "@/components/kit";

function parseAmountToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function money(cents: number, currency: string): string {
  return formatMoney(cents / 100, currency);
}

function ConfigCard({ parents }: { parents: Parent[] }) {
  const store = useCoParentStore();
  const config = store?.getMoneyConfig();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [currency, setCurrency] = useState("EUR");

  if (!store || !config) return null;

  const fromParent = parents.find((p) => p.id === config.supportFromId);
  const toParent = parents.find((p) => p.id === config.supportToId);

  const startEditing = () => {
    setAmount(config.supportCents > 0 ? (config.supportCents / 100).toFixed(2) : "");
    setFromId(config.supportFromId || parents[0]?.id || "");
    setToId(config.supportToId || parents[1]?.id || "");
    setCurrency(config.currency);
    setEditing(true);
  };

  const save = () => {
    const cents = parseAmountToCents(amount) ?? 0;
    store.setMoneyConfig({
      currency,
      supportCents: fromId && toId && fromId !== toId ? cents : 0,
      supportFromId: fromId,
      supportToId: toId,
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="card row gap-sm" style={{ alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
          {config.supportCents > 0 && fromParent && toParent ? (
            <>
              Monthly support: <strong>{fromParent.name} → {toParent.name}</strong>{" "}
              {money(config.supportCents, config.currency)}
            </>
          ) : (
            <span className="muted">No fixed monthly support set.</span>
          )}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={startEditing}>
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="card stack-sm">
      <div className="section-title">Monthly support & currency</div>
      <div className="grid-2">
        <div className="field">
          <label>Amount per month</label>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Currency</label>
          <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Paid by</label>
          <select className="select" value={fromId} onChange={(e) => setFromId(e.target.value)}>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>To</label>
          <select className="select" value={toId} onChange={(e) => setToId(e.target.value)}>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>
          Save
        </button>
        <button className="btn btn-ghost" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddExpense({
  parties,
  memberId,
  currency,
}: {
  parties: Parent[];
  memberId: string;
  currency: string;
}) {
  const store = useCoParentStore();
  const isParty = parties.some((p) => p.id === memberId);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(isParty ? memberId : (parties[0]?.id ?? ""));
  const [split, setSplit] = useState<ExpenseSplit>("half");
  const [date, setDate] = useState(todayStr());

  const amountCents = parseAmountToCents(amount);
  const canSave = !!store && !!description.trim() && amountCents !== null && !!paidById;

  const save = () => {
    if (!store || !canSave || amountCents === null) return;
    store.addExpense({ description, amountCents, paidById, split, date });
    setDescription("");
    setAmount("");
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">Add expense</div>
      <div className="field">
        <label>What was it</label>
        <input
          className="input"
          placeholder="School supplies · shoes · doctor"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Amount</label>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Paid by</label>
          <select className="select" value={paidById} onChange={(e) => setPaidById(e.target.value)}>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Split</label>
          <select className="select" value={split} onChange={(e) => setSplit(e.target.value as ExpenseSplit)}>
            <option value="half">÷2 — shared, half each</option>
            <option value="full">÷1 — the other owes it all</option>
          </select>
        </div>
      </div>
      {amountCents !== null && (
        <p className="meta-line" style={{ margin: 0 }}>
          Counts as {money(countedCents({ amountCents, split }), currency)} owed to the payer.
        </p>
      )}
      <button className="btn btn-primary btn-block" disabled={!canSave} onClick={save}>
        Add expense
      </button>
    </div>
  );
}

export function MoneyTab({ memberId }: { memberId: string }) {
  const store = useCoParentStore();
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(todayStr()));

  if (!store) return null;

  const parents = store.listParents();
  const config = store.getMoneyConfig();
  // The two settling parties: the configured support pair when set, else the
  // first two parents by join time.
  const partyA =
    parents.find((p) => p.id === config.supportToId) ?? parents[0] ?? null;
  const partyB =
    parents.find((p) => p.id === config.supportFromId && p.id !== partyA?.id) ??
    parents.find((p) => p.id !== partyA?.id) ??
    null;
  const byId = new Map(parents.map((p) => [p.id, p]));

  const allExpenses = store.listExpenses();
  const monthExpenses = allExpenses.filter((e) => monthKeyOf(e.date) === monthKey);
  const settlement = store.getSettlement(monthKey);

  const close =
    partyA && partyB
      ? closeMonth(monthExpenses, partyA.id, partyB.id, config)
      : null;

  return (
    <div className="stack">
      <div className="row gap-sm" style={{ alignItems: "center" }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="section-title" style={{ flex: 1, textAlign: "center", margin: 0 }}>
          {monthLabelOf(monthKey)}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <ConfigCard parents={parents} />

      {settlement && (
        <div className="card stack-sm" style={{ borderColor: "var(--accent)" }}>
          <strong>
            ✓ Month settled — {byId.get(settlement.fromId)?.name ?? "?"} paid{" "}
            {byId.get(settlement.toId)?.name ?? "?"} {money(settlement.amountCents, config.currency)}
          </strong>
          <div className="meta-line">
            Recorded by {byId.get(settlement.byId)?.name ?? "someone"} ·{" "}
            {formatRelativeTime(settlement.at)}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => store.unsettleMonth(monthKey)}
          >
            Reopen month
          </button>
        </div>
      )}

      {!settlement && partyA && partyB && (
        <AddExpense parties={[partyA, partyB]} memberId={memberId} currency={config.currency} />
      )}

      {monthExpenses.length === 0 ? (
        <EmptyState>No expenses logged for {monthLabelOf(monthKey)} yet.</EmptyState>
      ) : (
        <div className="stack-sm">
          {monthExpenses.map((e) => {
            const payer = byId.get(e.paidById);
            return (
              <RecordRow
                key={e.id}
                leading={payer ? <Avatar person={payer} /> : undefined}
                title={e.description}
                meta={
                  <>
                    {formatDate(e.date)} · {payer?.name ?? "?"} paid{" "}
                    {money(e.amountCents, config.currency)} · ÷{e.split === "half" ? "2" : "1"}
                  </>
                }
                trailing={
                  <>
                    <strong>{money(countedCents(e), config.currency)}</strong>
                    {!settlement && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label="Remove expense"
                        onClick={() => store.removeExpense(e.id)}
                      >
                        ✕
                      </button>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {close && partyA && partyB && (
        <div className="card stack-sm">
          <div className="section-title">Month close</div>
          <div style={{ fontSize: 14 }}>
            {partyB.name} owes {partyA.name}:{" "}
            <strong>{money(close.totals.get(partyA.id) ?? 0, config.currency)}</strong>
          </div>
          <div style={{ fontSize: 14 }}>
            {partyA.name} owes {partyB.name}:{" "}
            <strong>{money(close.totals.get(partyB.id) ?? 0, config.currency)}</strong>
          </div>
          <div className="meta-line">
            Expenses net:{" "}
            {close.netCents === 0
              ? "even"
              : close.netCents > 0
                ? `${partyB.name} owes ${partyA.name} ${money(close.netCents, config.currency)}`
                : `${partyA.name} owes ${partyB.name} ${money(-close.netCents, config.currency)}`}
            {config.supportCents > 0 && byId.get(config.supportFromId) && byId.get(config.supportToId) && (
              <>
                {" "}· Support: {byId.get(config.supportFromId)!.name} →{" "}
                {byId.get(config.supportToId)!.name} {money(config.supportCents, config.currency)}
              </>
            )}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {close.final
              ? `${byId.get(close.final.fromId)?.name ?? "?"} pays ${byId.get(close.final.toId)?.name ?? "?"} ${money(close.final.amountCents, config.currency)}`
              : "All square 🎉"}
          </div>
          {!settlement && (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() =>
                store.settleMonth({
                  monthKey,
                  amountCents: close.final?.amountCents ?? 0,
                  fromId: close.final?.fromId ?? partyB.id,
                  toId: close.final?.toId ?? partyA.id,
                  byId: memberId,
                })
              }
            >
              Mark {monthLabelOf(monthKey)} settled
            </button>
          )}
        </div>
      )}
    </div>
  );
}
