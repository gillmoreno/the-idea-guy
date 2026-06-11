"use client";

import { useState } from "react";
import { todayStr } from "../lib/store";
import { EXPENSE_CATEGORIES, type Roommate } from "../lib/types";
import { useRoomLedgerStore } from "../lib/useRoomLedgerStore";

function parseAmountToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function AddExpense({
  roommates,
  currentMemberId,
  onDone,
}: {
  roommates: Roommate[];
  currentMemberId: string;
  onDone: () => void;
}) {
  const store = useRoomLedgerStore();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Groceries");
  const [paidById, setPaidById] = useState(currentMemberId);
  const [splitAmong, setSplitAmong] = useState<Set<string>>(
    () => new Set(roommates.map((r) => r.id)),
  );
  const [date, setDate] = useState(todayStr());

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

  const amountCents = parseAmountToCents(amount);
  const canSave =
    !!store &&
    description.trim() &&
    amountCents != null &&
    splitAmong.size > 0 &&
    roommates.some((r) => r.id === paidById);

  const save = () => {
    if (!store || !canSave || amountCents == null) return;
    store.addExpense({
      description,
      amountCents,
      category,
      paidById,
      splitAmongIds: [...splitAmong],
      date,
      createdById: currentMemberId,
    });
    onDone();
  };

  return (
    <div className="card stack">
      <div className="section-title">Add expense</div>
      <div className="field">
        <label>What was it for?</label>
        <input
          className="input"
          placeholder="Rent, internet, toilet paper…"
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
      <div className="grid-2">
        <div className="field">
          <label>Category</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Paid by</label>
          <select className="select" value={paidById} onChange={(e) => setPaidById(e.target.value)}>
            {roommates.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Split equally among</label>
        <div className="stack-sm">
          {roommates.map((r) => (
            <label key={r.id} className="row gap-sm" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={splitAmong.has(r.id)}
                onChange={() => toggleSplit(r.id)}
              />
              <span>{r.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          Save expense
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
