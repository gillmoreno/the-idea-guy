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
import type { LedgerEntry } from "../lib/types";
import { ROOMMATE_COLORS } from "../lib/types";
import { useRoomLedgerStore } from "../lib/useRoomLedgerStore";
import { AddExpense } from "./AddExpense";
import { BalancesPanel } from "./BalancesPanel";
import { MoneyCents } from "./ui";
import { Avatar } from "@/components/kit";

type Tab = "expenses" | "balances";

function monthLabel(date: string): string {
  const [y, m] = date.split("-").map(Number);
  if (!y || !m) return date;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function groupByMonth(entries: LedgerEntry[]): [string, LedgerEntry[]][] {
  const groups: [string, LedgerEntry[]][] = [];
  for (const entry of entries) {
    const label = monthLabel(entry.date);
    const last = groups[groups.length - 1];
    if (last && last[0] === label) last[1].push(entry);
    else groups.push([label, [entry]]);
  }
  return groups;
}

export function LedgerView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useRoomLedgerStore();
  const [tab, setTab] = useState<Tab>("expenses");
  const [adding, setAdding] = useState(false);

  if (!store) return null;

  const house = store.getHouse()!;
  const roommates = store.listRoommates();
  const entries = store.listEntries();
  const me = store.getRoommate(memberId);
  const byId = new Map(roommates.map((r) => [r.id, r]));

  return (
    <div className="app">
      <TopbarPersona
        title={house.name}
        subtitle={me?.name ?? "Roommate"}
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
                roommates={roommates}
                currentMemberId={memberId}
                onDone={() => setAdding(false)}
              />
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
                + Add expense
              </button>
            )}

            {entries.length === 0 ? (
              <div className="empty">
                {roommates.length < 2
                  ? "Add your flatmates by name below — they don't need the app — then log the first bill."
                  : "No expenses yet. Add the first one — rent, internet, the shared groceries run."}
              </div>
            ) : (
              groupByMonth(entries).map(([label, monthEntries]) => (
                <div key={label} className="stack-sm">
                  <div className="section-title">{label}</div>
                  {monthEntries.map((entry) => {
                    const payer = byId.get(entry.paidById);
                    if (entry.kind === "settlement") {
                      const recipient = byId.get(entry.splitAmongIds[0] ?? "");
                      return (
                        <div key={entry.id} className="card row gap-sm">
                          <Avatar
                            person={payer ?? { id: entry.paidById, name: "?", color: "#ccc", joinedAt: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>
                              {payer?.name ?? "Someone"} paid {recipient?.name ?? "someone"}
                            </strong>
                            <div className="muted" style={{ fontSize: 13 }}>
                              {formatDate(entry.date)} · settle-up
                            </div>
                          </div>
                          <MoneyCents cents={entry.amountCents} currency={house.currency} />
                        </div>
                      );
                    }
                    const splitNames = entry.splitAmongIds
                      .map((id) => byId.get(id)?.name)
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <div key={entry.id} className="card row gap-sm">
                        <Avatar
                          person={payer ?? { id: entry.paidById, name: "?", color: "#ccc", joinedAt: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{entry.description}</strong>
                          <div className="muted" style={{ fontSize: 13 }}>
                            {formatDate(entry.date)}
                            {entry.category ? ` · ${entry.category}` : ""} ·{" "}
                            {payer?.name ?? "Someone"} paid · split: {splitNames}
                          </div>
                        </div>
                        <MoneyCents cents={entry.amountCents} currency={house.currency} />
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </>
        )}

        {tab === "balances" && (
          <BalancesPanel
            roommates={roommates}
            entries={entries}
            currency={house.currency}
            currentMemberId={memberId}
          />
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <div className="stack-sm">
            <div className="section-title">Add roommate by name</div>
            <AddPersonByName
              placeholder="Roommate name"
              hint="For flatmates without the app — anyone here can log what they paid. If they join later, they tap their name to claim it."
              existingNames={roommates.map((r) => r.name)}
              colors={ROOMMATE_COLORS}
              onAdd={(p) => store.addRoommate({ name: p.name, color: p.color })}
            />
          </div>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite roommates"
            hint="Invite contacts to join this household — everyone logs and sees the same ledger."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addRoommate({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so roommates can join from their phones."
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
