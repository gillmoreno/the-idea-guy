"use client";

import { useState } from "react";
import { ImageField } from "@/components/ImageField";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ACTIVITY_META, type ActivityType } from "../lib/types";
import { useFitCrewStore } from "../lib/useFitCrewStore";

export function LogWorkout({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const store = useFitCrewStore();
  const { compactRoom } = useRoomSession();
  const [activity, setActivity] = useState<ActivityType>("run");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [proofImage, setProofImage] = useState("");

  const save = () => {
    if (!store) return;
    const mins = minutes.trim() ? Number(minutes) : undefined;
    store.addLog({
      memberId,
      activity,
      minutes: Number.isFinite(mins) ? mins : undefined,
      note,
      proofImage: proofImage || undefined,
    });
    onDone();
  };

  return (
    <div className="card stack">
      <div className="section-title">Log workout</div>
      <div className="field">
        <label>Activity</label>
        <select
          className="select"
          value={activity}
          onChange={(e) => setActivity(e.target.value as ActivityType)}
        >
          {(Object.keys(ACTIVITY_META) as ActivityType[]).map((key) => (
            <option key={key} value={key}>
              {ACTIVITY_META[key].emoji} {ACTIVITY_META[key].label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Minutes (optional)</label>
        <input
          className="input"
          inputMode="numeric"
          placeholder="30"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <textarea
          className="input"
          rows={2}
          placeholder="Morning 5K, leg day…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Proof photo (optional)</label>
        <ImageField
          value={proofImage}
          onChange={setProofImage}
          onInlineUploaded={() => compactRoom()}
        />
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} type="button" onClick={save}>
          Log it
        </button>
        <button className="btn" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
