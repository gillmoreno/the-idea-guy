"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/relativeTime";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { AppTabBar } from "@/shell/AppTabBar";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import type { Entry } from "../lib/types";
import { SEVERITY_LABELS, severityColor } from "../lib/types";
import { useSymptomDiaryStore } from "../lib/useSymptomDiaryStore";
import { Avatar } from "./ui";

type Tab = "log" | "history";

function dayLabel(at: number): string {
  return new Date(at).toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function SeverityBadge({ severity }: { severity: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        minWidth: 20,
        textAlign: "center",
        padding: "2px 8px",
        borderRadius: 999,
        background: severityColor(severity),
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {severity}
    </span>
  );
}

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useSymptomDiaryStore();
  const [tab, setTab] = useState<Tab>("log");
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState(3);
  const [note, setNote] = useState("");

  if (!store) return null;

  const diary = store.getDiary()!;
  const observers = store.listObservers();
  const entries = store.listEntries();
  const byId = new Map(observers.map((o) => [o.id, o]));

  const entriesByDay: [string, Entry[]][] = [];
  for (const entry of entries) {
    const label = dayLabel(entry.at);
    const last = entriesByDay[entriesByDay.length - 1];
    if (last && last[0] === label) last[1].push(entry);
    else entriesByDay.push([label, [entry]]);
  }

  const logEntry = () => {
    if (!symptom.trim()) return;
    store.logEntry({ symptom, severity, note, byId: memberId });
    setSymptom("");
    setNote("");
    setSeverity(3);
  };

  const lastEntry = entries[0] ?? null;

  return (
    <div className="app">
      <TopbarPersona
        title={`${diary.patientName} · symptom diary`}
        subtitle={diary.notes || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "log"}
          className={tab === "log" ? "active" : ""}
          onClick={() => setTab("log")}
        >
          Log
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
        {tab === "log" && (
          <>
            <div className="card stack-sm">
              <div className="section-title">How is it right now?</div>
              <div className="field">
                <label>Symptom</label>
                <input
                  className="input"
                  placeholder="Headache · dizzy after lunch · slept badly"
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                />
              </div>
              <div className="field">
                <label>
                  Severity — {severity} ({SEVERITY_LABELS[severity]})
                </label>
                <div className="row gap-sm">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="btn"
                      aria-pressed={severity === s}
                      style={{
                        flex: 1,
                        ...(severity === s
                          ? { background: severityColor(s), color: "#fff", borderColor: severityColor(s) }
                          : {}),
                      }}
                      onClick={() => setSeverity(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Note (trigger, what helped — optional)</label>
                <input
                  className="input"
                  placeholder="After coffee · took ibuprofen 400"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary btn-block"
                disabled={!symptom.trim()}
                onClick={logEntry}
              >
                Log it
              </button>
            </div>

            {lastEntry && (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                Last entry: {lastEntry.symptom} ({lastEntry.severity}) ·{" "}
                {formatRelativeTime(lastEntry.at)} by{" "}
                {byId.get(lastEntry.byId)?.name ?? "someone"}
              </p>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {entries.length === 0 ? (
              <div className="empty">Nothing logged yet — entries appear here, newest first.</div>
            ) : (
              entriesByDay.map(([label, dayEntries]) => (
                <div key={label} className="stack-sm">
                  <div className="section-title">{label}</div>
                  {dayEntries.map((entry) => {
                    const observer = byId.get(entry.byId);
                    return (
                      <div key={entry.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                        <SeverityBadge severity={entry.severity} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{entry.symptom}</strong>
                          <div className="muted" style={{ fontSize: 13 }}>
                            {timeLabel(entry.at)} · {observer?.name ?? "someone"}
                            {entry.note ? ` · ${entry.note}` : ""}
                          </div>
                        </div>
                        {entry.byId === memberId && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            aria-label="Remove entry"
                            onClick={() => store.removeEntry(entry.id)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite observers"
            hint="A partner or family member can log what they notice too."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addObserver({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so observers can join from their phones."
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
