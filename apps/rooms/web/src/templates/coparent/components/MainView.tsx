"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/templates/choreboard/lib/format";
import { formatRelativeTime } from "@/lib/relativeTime";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { AppTabBar } from "@/shell/AppTabBar";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import type { Stay } from "../lib/types";
import { overlappingStayIds, stayOn, staysOverlap } from "../lib/types";
import { todayStr } from "../lib/store";
import { useCoParentStore } from "../lib/useCoParentStore";
import { Avatar } from "./ui";
import { MoneyTab } from "./MoneyTab";

type Tab = "schedule" | "updates" | "money";

function AddStay({ memberId, existing }: { memberId: string; existing: Stay[] }) {
  const store = useCoParentStore();
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(todayStr());
  const [note, setNote] = useState("");

  const rangeOk = !!start && !!end && start <= end;
  const candidate: Stay = { id: "candidate", start, end, parentId: memberId, createdAt: 0 };
  const clash = rangeOk ? existing.find((s) => staysOverlap(s, candidate)) : undefined;
  const canSave = !!store && rangeOk;

  const save = () => {
    if (!store || !canSave) return;
    store.addStay({ start, end, parentId: memberId, note });
    setNote("");
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">Add days with you</div>
      <div className="grid-2">
        <div className="field">
          <label>From</label>
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label>To</label>
          <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <input
          className="input"
          placeholder="School week · holiday at grandma's"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {clash && (
        <p style={{ fontSize: 13, margin: 0, color: "var(--danger, #dc2626)" }}>
          ⚠️ Overlaps {formatDate(clash.start)} – {formatDate(clash.end)} — saving will flag
          both so you can sort it out together.
        </p>
      )}
      <button className="btn btn-primary btn-block" disabled={!canSave} onClick={save}>
        Add to schedule
      </button>
    </div>
  );
}

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useCoParentStore();
  const [tab, setTab] = useState<Tab>("schedule");
  const [updateText, setUpdateText] = useState("");

  if (!store) return null;

  const hub = store.getHub()!;
  const parents = store.listParents();
  const stays = store.listStays();
  const updates = store.listUpdates();
  const byId = new Map(parents.map((p) => [p.id, p]));
  const today = todayStr();
  const todayStay = stayOn(stays, today);
  const todayParent = todayStay ? byId.get(todayStay.parentId) : null;
  const upcoming = stays.filter((s) => s.end >= today);
  const past = stays.filter((s) => s.end < today).reverse();
  const clashes = overlappingStayIds(stays);

  const postUpdate = () => {
    if (!updateText.trim()) return;
    store.addUpdate({ text: updateText, byId: memberId });
    setUpdateText("");
  };

  const renderStay = (s: Stay) => {
    const parent = byId.get(s.parentId);
    return (
      <div
        key={s.id}
        className="card row gap-sm"
        style={{
          alignItems: "center",
          ...(clashes.has(s.id) ? { borderColor: "var(--danger, #dc2626)" } : {}),
        }}
      >
        {parent && <Avatar parent={parent} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>
            {formatDate(s.start)} – {formatDate(s.end)}
          </strong>
          <div className="muted" style={{ fontSize: 13 }}>
            with {parent?.name ?? "someone"}
            {s.note ? ` · ${s.note}` : ""}
            {clashes.has(s.id) ? " · ⚠️ overlaps" : ""}
          </div>
        </div>
        {s.parentId === memberId && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => store.removeStay(s.id)}>
            Remove
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <TopbarPersona
        title={`${hub.kidsLabel} · co-parenting`}
        subtitle={hub.notes || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "schedule"}
          className={tab === "schedule" ? "active" : ""}
          onClick={() => setTab("schedule")}
        >
          Schedule
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "updates"}
          className={tab === "updates" ? "active" : ""}
          onClick={() => setTab("updates")}
        >
          Updates
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "money"}
          className={tab === "money" ? "active" : ""}
          onClick={() => setTab("money")}
        >
          Money
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "schedule" && (
          <>
            <div className="card row gap-sm" style={{ alignItems: "center" }}>
              {todayParent ? (
                <>
                  <Avatar parent={todayParent} />
                  <div style={{ flex: 1 }}>
                    <strong>
                      Today: {todayParent.id === memberId ? "kids are with you" : `kids are with ${todayParent.name}`}
                    </strong>
                    {todayStay?.note && (
                      <div className="muted" style={{ fontSize: 13 }}>{todayStay.note}</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="muted" style={{ fontSize: 14 }}>
                  Nothing on the schedule for today yet.
                </div>
              )}
            </div>

            <AddStay memberId={memberId} existing={upcoming} />

            <div className="section-title">Coming up</div>
            {upcoming.length === 0 ? (
              <div className="empty">No days scheduled — each parent adds the days the kids are with them.</div>
            ) : (
              <div className="stack-sm">{upcoming.map(renderStay)}</div>
            )}

            {past.length > 0 && (
              <>
                <div className="section-title">Past</div>
                <div className="stack-sm">{past.slice(0, 10).map(renderStay)}</div>
              </>
            )}
          </>
        )}

        {tab === "money" && <MoneyTab memberId={memberId} />}

        {tab === "updates" && (
          <>
            <div className="card stack-sm">
              <div className="section-title">Share an update</div>
              <textarea
                className="input"
                rows={3}
                placeholder="Emma's school play is Thursday · Noah's inhaler is in his backpack"
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
              />
              <button
                className="btn btn-primary btn-block"
                disabled={!updateText.trim()}
                onClick={postUpdate}
              >
                Post update
              </button>
            </div>

            {updates.length === 0 ? (
              <div className="empty">No updates yet — school news, health notes, handoff details.</div>
            ) : (
              <div className="stack-sm">
                {updates.map((u) => {
                  const author = byId.get(u.byId);
                  return (
                    <div key={u.id} className="card stack-sm">
                      <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{u.text}</p>
                      <div className="row gap-sm" style={{ alignItems: "center" }}>
                        {author && <Avatar parent={author} />}
                        <span className="muted" style={{ fontSize: 12 }}>
                          {author?.name ?? "Someone"} · {formatRelativeTime(u.at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite co-parents"
            hint="Invite the other parent (and step-parents or grandparents who help)."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addParent({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so the other household can join."
          />
          <Link className="btn btn-ghost btn-block" href="/">
            Home
          </Link>
          <button className="btn btn-ghost btn-block" onClick={leaveRoom}>
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
