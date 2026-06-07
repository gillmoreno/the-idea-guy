"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/templates/choreboard/lib/format";
import { SyncBadge } from "@/templates/choreboard/components/ui";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { useTripSplitStore } from "../lib/useTripSplitStore";
import { AddExpense } from "./AddExpense";
import { BalancesPanel } from "./BalancesPanel";
import { Avatar, MoneyCents } from "./ui";

type Tab = "expenses" | "balances";

export function TripView({ memberId }: { memberId: string }) {
  const { sync, setCurrentMember, leave, roomCode, hasAdminAccess } = useRoomSession();
  const store = useTripSplitStore();
  const [tab, setTab] = useState<Tab>("expenses");
  const [adding, setAdding] = useState(false);

  if (!store) return null;

  const trip = store.getTrip()!;
  const travelers = store.listTravelers();
  const expenses = store.listExpenses();
  const me = store.getTraveler(memberId);
  const byId = new Map(travelers.map((t) => [t.id, t]));

  return (
    <div className="app">
      <div className="topbar">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>{trip.name}</h1>
          <div className="sub row gap-sm">
            <span>{me?.name ?? "Traveler"}</span>
            <SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setCurrentMember(null)}>
          Switch
        </button>
      </div>

      <div className="tabs" style={{ padding: "0 16px 8px" }}>
        <button
          className={tab === "expenses" ? "active" : ""}
          onClick={() => setTab("expenses")}
        >
          Expenses
        </button>
        <button
          className={tab === "balances" ? "active" : ""}
          onClick={() => setTab("balances")}
        >
          Balances
        </button>
      </div>

      <div className="app-main stack">
        {tab === "expenses" && (
          <>
            {adding ? (
              <AddExpense
                travelers={travelers}
                currentMemberId={memberId}
                onDone={() => setAdding(false)}
              />
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
                + Add expense
              </button>
            )}

            {expenses.length === 0 ? (
              <div className="empty">
                No expenses yet. Add the first one — dinner, hotel, groceries, anything shared.
              </div>
            ) : (
              <div className="stack-sm">
                {expenses.map((exp) => {
                  const payer = byId.get(exp.paidById);
                  const splitNames = exp.splitAmongIds
                    .map((id) => byId.get(id)?.name)
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <div key={exp.id} className="card row gap-sm">
                      <Avatar traveler={payer ?? { id: exp.paidById, name: "?", color: "#ccc", joinedAt: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{exp.description}</strong>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {formatDate(exp.date)} · {payer?.name ?? "Someone"} paid · split: {splitNames}
                        </div>
                      </div>
                      <MoneyCents cents={exp.amountCents} currency={trip.currency} />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "balances" && (
          <BalancesPanel travelers={travelers} expenses={expenses} currency={trip.currency} />
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <div className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>
            Room code: {roomCode}
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            Share the room code so friends can join and add expenses from their phones.
          </p>
          <Link className="btn btn-ghost btn-block" href="/">
            Home
          </Link>
          <button className="btn btn-ghost btn-block" onClick={leave}>
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
