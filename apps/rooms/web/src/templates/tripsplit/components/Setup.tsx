"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { CURRENCY_OPTIONS } from "@/templates/choreboard/lib/format";
import { TRAVELER_COLORS } from "../lib/types";
import { useTripSplitStore } from "../lib/useTripSplitStore";

interface DraftTraveler {
  name: string;
  color: string;
}

export function Setup() {
  const store = useTripSplitStore();
  const [name, setName] = useState("Our trip");
  const [currency, setCurrency] = useState("USD");
  const [travelers, setTravelers] = useState<DraftTraveler[]>([
    { name: "", color: TRAVELER_COLORS[0] },
  ]);

  const addRow = () =>
    setTravelers((rows) => [
      ...rows,
      { name: "", color: TRAVELER_COLORS[rows.length % TRAVELER_COLORS.length] },
    ]);

  const update = (i: number, patch: Partial<DraftTraveler>) =>
    setTravelers((rows) => rows.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const remove = (i: number) => setTravelers((rows) => rows.filter((_, idx) => idx !== i));

  const validTravelers = travelers.filter((t) => t.name.trim());
  const canFinish = !!store && name.trim() && validTravelers.length >= 2;

  const finish = () => {
    if (!store) return;
    store.initTrip({ name: name.trim(), currency });
    for (const t of validTravelers) {
      store.addTraveler({ name: t.name.trim(), color: t.color });
    }
  };

  return (
    <div className="app">
      <SetupTopbar title="Set up your trip" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Split expenses with friends — like Splitwise, but your data stays on your devices.
          </p>
          <div className="field">
            <label>Trip name</label>
            <input
              className="input"
              placeholder="Barcelona 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Currency</label>
            <select
              className="select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="section-title">Travelers</div>
          <p className="muted" style={{ fontSize: 13 }}>
            Add everyone splitting costs. You need at least two people.
          </p>
          {travelers.map((t, i) => (
            <div key={i} className="row gap-sm" style={{ alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 1 }}>
                <label>{i === 0 ? "Name" : `Traveler ${i + 1}`}</label>
                <input
                  className="input"
                  placeholder="Alex"
                  value={t.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Color</label>
                <select
                  className="select"
                  value={t.color}
                  onChange={(e) => update(i, { color: e.target.value })}
                >
                  {TRAVELER_COLORS.map((c) => (
                    <option key={c} value={c}>
                      ●
                    </option>
                  ))}
                </select>
              </div>
              {travelers.length > 1 && (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => remove(i)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost btn-block" type="button" onClick={addRow}>
            + Add traveler
          </button>
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={!canFinish}
          onClick={finish}
        >
          Start splitting
        </button>
      </div>
    </div>
  );
}
