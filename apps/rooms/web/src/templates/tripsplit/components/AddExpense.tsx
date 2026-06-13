"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { allocateShares } from "@/lib/splitMath";
import { todayStr } from "../lib/store";
import type { Expense, Traveler } from "../lib/types";
import { useTripSplitStore } from "../lib/useTripSplitStore";

function parseAmountToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function AddExpense({
  travelers,
  currentMemberId,
  currency,
  expense,
  onDone,
}: {
  travelers: Traveler[];
  currentMemberId: string;
  currency: string;
  /** When provided, the form edits this expense instead of creating a new one. */
  expense?: Expense;
  onDone: () => void;
}) {
  const store = useTripSplitStore();
  const editing = expense != null;
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(
    expense ? String(expense.amountCents / 100) : "",
  );
  const [paidById, setPaidById] = useState(expense?.paidById ?? currentMemberId);
  const [splitAmong, setSplitAmong] = useState<Set<string>>(() =>
    expense ? new Set(expense.splitAmongIds) : new Set(travelers.map((t) => t.id)),
  );
  // Per-traveler share weights. Everyone starts at 1 = a plain equal split;
  // when editing, seed from the expense's stored weights.
  const [shares, setShares] = useState<Record<string, number>>(() =>
    Object.fromEntries(travelers.map((t) => [t.id, expense?.shares?.[t.id] ?? 1])),
  );
  const [date, setDate] = useState(expense?.date ?? todayStr());

  const toggleSplit = (id: string) => {
    setSplitAmong((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const setShare = (id: string, value: number) => {
    setShares((prev) => ({ ...prev, [id]: Math.max(1, Math.min(99, value)) }));
  };

  const amountCents = parseAmountToCents(amount);
  const splitIds = travelers.map((t) => t.id).filter((id) => splitAmong.has(id));
  const isUneven = splitIds.some((id) => (shares[id] ?? 1) !== (shares[splitIds[0]] ?? 1));
  const totalShares = splitIds.reduce((sum, id) => sum + (shares[id] ?? 1), 0);

  // Live per-person amounts using the same allocator the balances use.
  const preview =
    amountCents != null && splitIds.length > 0
      ? allocateShares(amountCents, splitIds, shares)
      : new Map<string, number>();

  const canSave =
    !!store &&
    description.trim() &&
    amountCents != null &&
    splitAmong.size > 0 &&
    travelers.some((t) => t.id === paidById);

  const save = () => {
    if (!store || !canSave || amountCents == null) return;
    if (editing && expense) {
      store.updateExpense(expense.id, {
        description,
        amountCents,
        paidById,
        splitAmongIds: splitIds,
        shares,
        date,
      });
    } else {
      store.addExpense({
        description,
        amountCents,
        paidById,
        splitAmongIds: splitIds,
        shares,
        date,
        createdById: currentMemberId,
      });
    }
    onDone();
  };

  const remove = () => {
    if (!store || !expense) return;
    store.removeExpense(expense.id);
    onDone();
  };

  return (
    <div className="card stack">
      <div className="section-title">{editing ? "Edit expense" : "Add expense"}</div>
      <div className="field">
        <label>What was it for?</label>
        <input
          className="input"
          placeholder="Dinner, Airbnb, gas…"
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
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label>Paid by</label>
        <select className="select" value={paidById} onChange={(e) => setPaidById(e.target.value)}>
          {travelers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Split between</label>
        <p className="muted" style={{ fontSize: 12, marginTop: -2 }}>
          Everyone starts at 1 share (split equally). Bump someone’s shares to
          make them pay a bigger slice — e.g. 2 / 2 / 1 divides by 5.
        </p>
        <div className="stack-sm">
          {travelers.map((t) => {
            const included = splitAmong.has(t.id);
            const share = shares[t.id] ?? 1;
            const owed = preview.get(t.id);
            return (
              <div
                key={t.id}
                className="row gap-sm"
                style={{ alignItems: "center", opacity: included ? 1 : 0.45 }}
              >
                <label className="row gap-sm" style={{ flex: 1, cursor: "pointer", minWidth: 0 }}>
                  <input type="checkbox" checked={included} onChange={() => toggleSplit(t.id)} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                </label>
                {included && (
                  <>
                    {owed != null && (
                      <span className="meta-line" style={{ whiteSpace: "nowrap" }}>
                        {formatMoney(owed / 100, currency)}
                      </span>
                    )}
                    <div className="row gap-sm" style={{ alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "2px 10px", minWidth: 0 }}
                        onClick={() => setShare(t.id, share - 1)}
                        disabled={share <= 1}
                        aria-label={`Fewer shares for ${t.name}`}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 18, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                        {share}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "2px 10px", minWidth: 0 }}
                        onClick={() => setShare(t.id, share + 1)}
                        aria-label={`More shares for ${t.name}`}
                      >
                        +
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {isUneven && (
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            Splitting by {splitIds.map((id) => shares[id] ?? 1).join(" / ")} ={" "}
            {totalShares} shares.
          </p>
        )}
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          {editing ? "Save changes" : "Save expense"}
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
      {editing && (
        <button
          className="btn btn-ghost btn-block"
          style={{ color: "var(--danger, #ef4444)" }}
          onClick={remove}
        >
          Delete expense
        </button>
      )}
    </div>
  );
}
