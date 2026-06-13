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
import type { Family } from "../lib/types";
import { FAMILY_COLORS, formatHours, minuteBalances, parseHoursToMinutes } from "../lib/types";
import { todayStr } from "../lib/store";
import { useSitCoopStore } from "../lib/useSitCoopStore";
import { Avatar } from "@/components/kit";

type Tab = "balances" | "history";

function LogSit({
  families,
  memberId,
  onDone,
}: {
  families: Family[];
  memberId: string;
  onDone: () => void;
}) {
  const store = useSitCoopStore();
  const other = families.find((f) => f.id !== memberId);
  const [sitterId, setSitterId] = useState(memberId);
  const [forId, setForId] = useState(other?.id ?? "");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");

  const minutes = parseHoursToMinutes(hours);
  const canSave = !!store && minutes !== null && !!sitterId && !!forId && sitterId !== forId;

  const save = () => {
    if (!store || !canSave || minutes === null) return;
    store.logSit({ sitterId, forId, minutes, date, note, loggedById: memberId });
    onDone();
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">Log a sit</div>
      <div className="grid-2">
        <div className="field">
          <label>Who sat</label>
          <select className="select" value={sitterId} onChange={(e) => setSitterId(e.target.value)}>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>For whose kids</label>
          <select className="select" value={forId} onChange={(e) => setForId(e.target.value)}>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {sitterId === forId && (
        <p className="meta-line" style={{ margin: 0 }}>
          Pick two different families — sitting for yourself is just parenting.
        </p>
      )}
      <div className="grid-2">
        <div className="field">
          <label>Hours (e.g. 2.5)</label>
          <input
            className="input"
            inputMode="decimal"
            placeholder="3"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <input
          className="input"
          placeholder="Movie night · bedtime went fine"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          Log {minutes !== null ? formatHours(minutes) : "sit"}
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useSitCoopStore();
  const [tab, setTab] = useState<Tab>("balances");
  const [logging, setLogging] = useState(false);

  if (!store) return null;

  const coop = store.getCoop()!;
  const families = store.listFamilies();
  const sits = store.listSits();
  const byId = new Map(families.map((f) => [f.id, f]));
  const balances = minuteBalances(families, sits);

  return (
    <div className="app">
      <TopbarPersona
        title={coop.name}
        subtitle={coop.details || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "balances"}
          className={tab === "balances" ? "active" : ""}
          onClick={() => setTab("balances")}
        >
          Balances
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
        {tab === "balances" && (
          <>
            {logging ? (
              <LogSit families={families} memberId={memberId} onDone={() => setLogging(false)} />
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => setLogging(true)}>
                + Log a sit
              </button>
            )}
            {families.length < 2 && (
              <p className="meta-line" style={{ margin: 0 }}>
                A sit needs two families — add the others by name in settings below.
              </p>
            )}

            <div className="section-title">Hour balances</div>
            <p className="meta-line" style={{ margin: 0 }}>
              Earn hours by sitting, spend them by going out. Everyone starts at zero.
            </p>
            <div className="stack-sm">
              {[...families]
                .sort((a, b) => (balances.get(b.id) ?? 0) - (balances.get(a.id) ?? 0))
                .map((f) => {
                  const bal = balances.get(f.id) ?? 0;
                  return (
                    <div key={f.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                      <Avatar person={f} />
                      <strong style={{ flex: 1, minWidth: 0 }}>{f.name}</strong>
                      <strong className={bal < 0 ? "amount-neg" : "amount-pos"}>
                        {formatHours(bal)}
                      </strong>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {tab === "history" && (
          <>
            {sits.length === 0 ? (
              <div className="empty">No sits logged yet — the first night out starts the bank.</div>
            ) : (
              <div className="stack-sm">
                {sits.map((sit) => {
                  const sitter = byId.get(sit.sitterId);
                  const family = byId.get(sit.forId);
                  return (
                    <div key={sit.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                      {sitter && <Avatar person={sitter} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>
                          {sitter?.name ?? "?"} sat for {family?.name ?? "?"} ·{" "}
                          {formatHours(sit.minutes)}
                        </strong>
                        <div className="meta-line">
                          {formatDate(sit.date)}
                          {sit.note ? ` · ${sit.note}` : ""}
                        </div>
                      </div>
                      {sit.loggedById === memberId && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          aria-label="Remove sit"
                          onClick={() => store.removeSit(sit.id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <div className="stack-sm">
            <div className="section-title">Add family by name</div>
            <AddPersonByName
              placeholder="Family name"
              hint="Add the other families by name to start logging sits — they can claim their family when they join."
              existingNames={families.map((f) => f.name)}
              colors={FAMILY_COLORS}
              onAdd={(p) => store.addFamily({ name: p.name, color: p.color })}
            />
          </div>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite families"
            hint="Invite the other families — everyone sees the same hour bank."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addFamily({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so families can join from their phones."
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
