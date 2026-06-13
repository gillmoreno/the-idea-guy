"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { AppTabBar } from "@/shell/AppTabBar";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { SwitchProfile } from "@/shell/SwitchProfile";
import { AddPersonByName } from "@/shell/AddPersonByName";
import type { Booking, Owner } from "../lib/types";
import { OWNER_COLORS, bookingNights, bookingsOverlap, nightsByOwner, overlappingIds } from "../lib/types";
import { todayStr } from "../lib/store";
import { useCabinCalStore } from "../lib/useCabinCalStore";
import { EmptyState, Avatar } from "@/components/kit";

type Tab = "calendar" | "fairness";

function AddBooking({
  memberId,
  owners,
  existing,
}: {
  memberId: string;
  owners: Owner[];
  existing: Booking[];
}) {
  const store = useCabinCalStore();
  const isOwner = owners.some((o) => o.id === memberId);
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(todayStr());
  const [ownerId, setOwnerId] = useState(isOwner ? memberId : (owners[0]?.id ?? ""));
  const [note, setNote] = useState("");

  const rangeOk = !!start && !!end && start <= end;
  const candidate: Booking = {
    id: "candidate",
    start,
    end,
    ownerId,
    createdAt: 0,
  };
  const clash = rangeOk ? existing.find((b) => bookingsOverlap(b, candidate)) : undefined;
  const canSave = !!store && rangeOk && !clash && !!ownerId;

  const save = () => {
    if (!store || !canSave) return;
    store.addBooking({ start, end, ownerId, note });
    setNote("");
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">Claim dates</div>
      <div className="grid-2">
        <div className="field">
          <label>First night</label>
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label>Last night</label>
          <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Who&apos;s staying</label>
        <select className="select" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id === memberId ? `${o.name} (you)` : o.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <input
          className="input"
          placeholder="Bringing the kids · long weekend"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {!rangeOk && (start || end) && (
        <p className="meta-line" style={{ margin: 0 }}>
          Last night must be on or after the first night.
        </p>
      )}
      {clash && (
        <p style={{ fontSize: 13, margin: 0, color: "var(--danger, #dc2626)" }}>
          ⚠️ Clashes with {formatDate(clash.start)} – {formatDate(clash.end)}. Pick other dates
          or talk it out first.
        </p>
      )}
      <button className="btn btn-primary btn-block" disabled={!canSave} onClick={save}>
        Claim {rangeOk ? `${bookingNights(candidate)} night${bookingNights(candidate) === 1 ? "" : "s"}` : "dates"}
      </button>
    </div>
  );
}

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useCabinCalStore();
  const [tab, setTab] = useState<Tab>("calendar");

  if (!store) return null;

  const place = store.getPlace()!;
  const owners = store.listOwners();
  const bookings = store.listBookings();
  const byId = new Map(owners.map((o) => [o.id, o]));
  const today = todayStr();
  const upcoming = bookings.filter((b) => b.end >= today);
  const past = bookings.filter((b) => b.end < today).reverse();
  const clashes = overlappingIds(bookings);
  const nights = nightsByOwner(owners, bookings);

  const renderBooking = (b: Booking) => {
    const owner = byId.get(b.ownerId);
    return (
      <div
        key={b.id}
        className="card row gap-sm"
        style={{
          alignItems: "center",
          ...(clashes.has(b.id) ? { borderColor: "var(--danger, #dc2626)" } : {}),
        }}
      >
        {owner && <Avatar person={owner} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>
            {formatDate(b.start)} – {formatDate(b.end)}
          </strong>
          <div className="meta-line">
            {owner?.name ?? "Someone"} · {bookingNights(b)} night{bookingNights(b) === 1 ? "" : "s"}
            {b.note ? ` · ${b.note}` : ""}
            {clashes.has(b.id) ? " · ⚠️ double-booked" : ""}
          </div>
        </div>
        {b.ownerId === memberId && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => store.removeBooking(b.id)}
          >
            Free up
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <TopbarPersona
        title={place.name}
        subtitle={place.details || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "calendar"}
          className={tab === "calendar" ? "active" : ""}
          onClick={() => setTab("calendar")}
        >
          Calendar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "fairness"}
          className={tab === "fairness" ? "active" : ""}
          onClick={() => setTab("fairness")}
        >
          Nights tally
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "calendar" && (
          <>
            <AddBooking memberId={memberId} owners={owners} existing={upcoming} />

            <div className="section-title">Coming up</div>
            {upcoming.length === 0 ? (
              <EmptyState>Nothing booked — the place is free. Claim some dates.</EmptyState>
            ) : (
              <div className="stack-sm">{upcoming.map(renderBooking)}</div>
            )}

            {past.length > 0 && (
              <>
                <div className="section-title">Past stays</div>
                <div className="stack-sm">{past.slice(0, 10).map(renderBooking)}</div>
              </>
            )}
          </>
        )}

        {tab === "fairness" && (
          <>
            <p className="meta-line" style={{ margin: 0 }}>
              Total nights claimed per co-owner, past and upcoming — keeps the sharing honest.
            </p>
            <div className="stack-sm">
              {owners.map((o) => (
                <div key={o.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                  <Avatar person={o} />
                  <strong style={{ flex: 1, minWidth: 0 }}>{o.name}</strong>
                  <span>
                    {nights.get(o.id) ?? 0} night{(nights.get(o.id) ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <div className="stack-sm">
            <div className="section-title">Add co-owner by name</div>
            <AddPersonByName
              placeholder="Co-owner's name"
              hint="Add co-owners by name — you can claim dates for them, and they claim their name when they join."
              existingNames={owners.map((o) => o.name)}
              colors={OWNER_COLORS}
              onAdd={(p) => store.addOwner({ name: p.name, color: p.color })}
            />
          </div>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite co-owners"
            hint="Invite the others who share the place — one calendar, no clashes."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addOwner({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so co-owners can join from their phones."
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
