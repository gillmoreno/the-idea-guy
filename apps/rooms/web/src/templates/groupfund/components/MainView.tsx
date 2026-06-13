"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { formatRelativeTime } from "@/lib/relativeTime";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { AppTabBar } from "@/shell/AppTabBar";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { SwitchProfile } from "@/shell/SwitchProfile";
import { AddPersonByName } from "@/shell/AddPersonByName";
import { SAVER_COLORS, totalsBySaver } from "../lib/types";
import { useGroupFundStore } from "../lib/useGroupFundStore";
import { Avatar, EmptyState, RecordRow } from "@/components/kit";

type Tab = "fund" | "history";

function parseAmountToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useGroupFundStore();
  const [tab, setTab] = useState<Tab>("fund");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [fromId, setFromId] = useState(memberId);

  if (!store) return null;

  const fund = store.getFund()!;
  const savers = store.listSavers();
  const contributions = store.listContributions();
  const byId = new Map(savers.map((s) => [s.id, s]));
  const totals = totalsBySaver(savers, contributions);
  const totalCents = contributions.reduce((sum, c) => sum + c.amountCents, 0);
  const pct =
    fund.targetCents > 0 ? Math.min(100, Math.round((totalCents / fund.targetCents) * 100)) : null;
  const money = (cents: number) => formatMoney(cents / 100, fund.currency);

  const amountCents = parseAmountToCents(amount);

  const contribute = () => {
    if (amountCents === null) return;
    store.addContribution({ amountCents, byId: byId.has(fromId) ? fromId : memberId, note });
    setAmount("");
    setNote("");
  };

  return (
    <div className="app">
      <TopbarPersona
        title={fund.name}
        subtitle={fund.details || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "fund"}
          className={tab === "fund" ? "active" : ""}
          onClick={() => setTab("fund")}
        >
          Fund
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "fund" && (
          <>
            <div className="card stack-sm" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{money(totalCents)}</div>
              {fund.targetCents > 0 ? (
                <>
                  <div
                    role="progressbar"
                    aria-valuenow={pct ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    style={{
                      height: 12,
                      borderRadius: 6,
                      background: "var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "var(--template-accent, var(--primary))",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <div className="meta-line">
                    {pct}% of {money(fund.targetCents)}
                    {totalCents >= fund.targetCents ? " — target reached! 🎉" : ""}
                  </div>
                </>
              ) : (
                <div className="meta-line">
                  Open-ended fund — every bit counts.
                </div>
              )}
            </div>

            <div className="card stack-sm">
              <div className="section-title">Chip in</div>
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
                  <label>Note (optional)</label>
                  <input
                    className="input"
                    placeholder="from the bonus"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>From</label>
                <select
                  className="select"
                  value={byId.has(fromId) ? fromId : memberId}
                  onChange={(e) => setFromId(e.target.value)}
                >
                  {savers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id === memberId ? `${s.name} (you)` : s.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary btn-block"
                disabled={amountCents === null}
                onClick={contribute}
              >
                Add {amountCents !== null ? money(amountCents) : "contribution"}
              </button>
            </div>

            <div className="section-title">Who&apos;s put in what</div>
            <div className="stack-sm">
              {[...savers]
                .sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0))
                .map((s) => (
                  <div key={s.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                    <Avatar person={s} />
                    <strong style={{ flex: 1, minWidth: 0 }}>{s.name}</strong>
                    <span>{money(totals.get(s.id) ?? 0)}</span>
                  </div>
                ))}
            </div>
          </>
        )}

        {tab === "history" && (
          <>
            {contributions.length === 0 ? (
              <EmptyState>No contributions yet — be the first to chip in.</EmptyState>
            ) : (
              <div className="stack-sm">
                {contributions.map((c) => {
                  const saver = byId.get(c.byId);
                  return (
                    <RecordRow
                      key={c.id}
                      leading={saver ? <Avatar person={saver} /> : undefined}
                      title={`${saver?.name ?? "Someone"} added ${money(c.amountCents)}`}
                      meta={`${formatRelativeTime(c.at)}${c.note ? ` · ${c.note}` : ""}`}
                      trailing={
                        c.byId === memberId ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            aria-label="Remove contribution"
                            onClick={() => store.removeContribution(c.id)}
                          >
                            ✕
                          </button>
                        ) : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <div className="stack-sm">
            <div className="section-title">Add saver by name</div>
            <AddPersonByName
              placeholder="Saver's name"
              hint="Add savers by name — log cash they hand you, and they claim their name when they join."
              existingNames={savers.map((s) => s.name)}
              colors={SAVER_COLORS}
              onAdd={(p) => store.addSaver({ name: p.name, color: p.color })}
            />
          </div>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite savers"
            hint="Invite the others — everyone sees the bar fill up."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addSaver({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so savers can join from their phones."
          />
          <Link className="btn btn-ghost btn-block" href="/">
            Home
          </Link>
          <SwitchProfile currentName={byId.get(memberId)?.name} />
          <button className="btn btn-ghost btn-block" onClick={leaveRoom}>
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
