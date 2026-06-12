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
import { SwitchProfile } from "@/shell/SwitchProfile";
import type { Drive } from "../lib/types";
import { driveCounts, nextDriver } from "../lib/types";
import { useCarpoolStore } from "../lib/useCarpoolStore";
import { Avatar } from "./ui";

type Tab = "rota" | "history";

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

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useCarpoolStore();
  const [tab, setTab] = useState<Tab>("rota");

  if (!store) return null;

  const rota = store.getRota()!;
  const drivers = store.listDrivers();
  const drives = store.listDrives();
  const byId = new Map(drivers.map((d) => [d.id, d]));
  const counts = driveCounts(drivers, drives);
  const next = nextDriver(drivers, drives);
  const lastDrive = drives[0] ?? null;

  const drivesByDay: [string, Drive[]][] = [];
  for (const drive of drives) {
    const label = dayLabel(drive.at);
    const last = drivesByDay[drivesByDay.length - 1];
    if (last && last[0] === label) last[1].push(drive);
    else drivesByDay.push([label, [drive]]);
  }

  return (
    <div className="app">
      <TopbarPersona
        title={rota.name}
        subtitle={rota.details || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "rota"}
          className={tab === "rota" ? "active" : ""}
          onClick={() => setTab("rota")}
        >
          Rota
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
        {tab === "rota" && (
          <>
            {next && (
              <div className="card stack-sm" style={{ textAlign: "center" }}>
                <div className="muted" style={{ fontSize: 13 }}>
                  Next up
                </div>
                <div className="row gap-sm" style={{ justifyContent: "center", alignItems: "center" }}>
                  <Avatar driver={next} large />
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {next.id === memberId ? "Your turn" : `${next.name}'s turn`}
                  </div>
                </div>
                {lastDrive && (
                  <div className="muted" style={{ fontSize: 13 }}>
                    Last drive: {byId.get(lastDrive.driverId)?.name ?? "Someone"} ·{" "}
                    {formatRelativeTime(lastDrive.at)}
                  </div>
                )}
              </div>
            )}

            <div className="section-title">Log a drive</div>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Tap whoever actually drove — swaps sort themselves out, the rota always
              suggests whoever has driven least.
            </p>
            <div className="stack-sm">
              {drivers.map((d) => (
                <div key={d.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                  <Avatar driver={d} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{d.name}</strong>
                    {next?.id === d.id && (
                      <span className="cadence-pill" style={{ marginLeft: 8 }}>
                        next up
                      </span>
                    )}
                    <div className="muted" style={{ fontSize: 13 }}>
                      {counts.get(d.id) ?? 0} drive{(counts.get(d.id) ?? 0) === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => store.logDrive({ driverId: d.id, loggedById: memberId })}
                  >
                    Drove
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "history" && (
          <>
            {drives.length === 0 ? (
              <div className="empty">No drives logged yet.</div>
            ) : (
              drivesByDay.map(([label, dayDrives]) => (
                <div key={label} className="stack-sm">
                  <div className="section-title">{label}</div>
                  {dayDrives.map((drive) => {
                    const driver = byId.get(drive.driverId);
                    return (
                      <div key={drive.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                        {driver && <Avatar driver={driver} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{driver?.name ?? "Someone"} drove</strong>
                          <div className="muted" style={{ fontSize: 13 }}>
                            {timeLabel(drive.at)}
                          </div>
                        </div>
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
            title="Invite drivers"
            hint="Invite the other parents — everyone sees whose turn it is and logs drives."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addDriver({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so drivers can join from their phones."
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
