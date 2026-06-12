"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/templates/choreboard/lib/format";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { AppTabBar } from "@/shell/AppTabBar";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { SwitchProfile } from "@/shell/SwitchProfile";
import { AddPersonByName } from "@/shell/AddPersonByName";
import { TRAVELER_COLORS } from "../lib/types";
import { useTripSplitStore } from "../lib/useTripSplitStore";
import { AddExpense } from "./AddExpense";
import { BalancesPanel } from "./BalancesPanel";
import { Avatar, MoneyCents } from "./ui";

type Tab = "expenses" | "balances";

export function TripView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
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
      <TopbarPersona
        title={trip.name}
        subtitle={me?.name ?? "Traveler"}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "expenses"}
          className={tab === "expenses" ? "active" : ""}
          onClick={() => setTab("expenses")}
        >
          Expenses
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "balances"}
          className={tab === "balances" ? "active" : ""}
          onClick={() => setTab("balances")}
        >
          Balances
        </button>
      </AppTabBar>

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
          <div className="stack-sm">
            <div className="section-title">Add traveler by name</div>
            <AddPersonByName
              placeholder="Traveler name"
              hint="For friends without the app — anyone here can log what they paid. If they join later, they tap their name to claim it."
              existingNames={travelers.map((t) => t.name)}
              colors={TRAVELER_COLORS}
              onAdd={(p) => store.addTraveler({ name: p.name, color: p.color })}
            />
          </div>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite travelers"
            hint="Invite contacts to join this trip — they can log expenses from their own phones."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addTraveler({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so friends can join and add expenses from their phones."
          />
          <Link className="btn btn-ghost btn-block" href="/">
            Home
          </Link>
          <SwitchProfile currentName={me?.name} />
          <button className="btn btn-ghost btn-block" onClick={leaveRoom}>
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
