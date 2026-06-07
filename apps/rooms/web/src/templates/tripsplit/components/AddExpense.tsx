"use client";

import { useState } from "react";
import { todayStr } from "../lib/store";
import type { Traveler } from "../lib/types";
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
  onDone,
}: {
  travelers: Traveler[];
  currentMemberId: string;
  onDone: () => void;
}) {
  const store = useTripSplitStore();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(currentMemberId);
  const [splitAmong, setSplitAmong] = useState<Set<string>>(
    () => new Set(travelers.map((t) => t.id)),
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
    travelers.some((t) => t.id === paidById);

  const save = () => {
    if (!store || !canSave || amountCents == null) return;
    store.addExpense({
      description,
      amountCents,
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
        <label>Split equally among</label>
        <div className="stack-sm">
          {travelers.map((t) => (
            <label key={t.id} className="row gap-sm" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={splitAmong.has(t.id)}
                onChange={() => toggleSplit(t.id)}
              />
              <span>{t.name}</span>
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
