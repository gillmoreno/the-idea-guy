"use client";

import { useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { getCollection, getFeatures } from "@/schema/validate";
import { bodyFields, emojiField, titleField } from "@/schema/display";
import type { CollectionDef, FeatureDef, RoomSchema } from "@/schema/types";
import { useSchemaStore } from "@/schema/useSchemaStore";

function fieldValue(record: { fields: Record<string, string | string[]> }, key: string): string {
  const v = record.fields[key];
  if (Array.isArray(v)) return v.join(", ");
  return typeof v === "string" ? v : "";
}

function AddRecordForm({
  collection,
  memberId,
  onDone,
}: {
  collection: CollectionDef;
  memberId: string;
  onDone: () => void;
}) {
  const store = useSchemaStore();
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of collection.fields) init[f.key] = "";
    return init;
  });

  const submit = () => {
    if (!store) return;
    const payload: Record<string, string | string[]> = {};
    for (const f of collection.fields) {
      const raw = (fields[f.key] ?? "").trim();
      if (f.required && !raw) return;
      if (f.type === "tags") {
        payload[f.key] = raw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else {
        payload[f.key] = raw;
      }
    }
    const statusFeature = getFeatures(store.schema, "status").find(
      (sf): sf is Extract<FeatureDef, { type: "status" }> =>
        sf.type === "status" && sf.collection === collection.id,
    );
    const defaultStatus = statusFeature?.values[0]?.id;
    store.addRecord(collection.id, {
      fields: payload,
      createdById: memberId,
      status: defaultStatus,
    });
    onDone();
  };

  const canSubmit = collection.fields.every((f) => !f.required || (fields[f.key] ?? "").trim());

  return (
    <div className="card stack">
      <div className="section-title">Add {collection.singular ?? collection.label}</div>
      {collection.fields.map((f) => (
        <div key={f.key} className="field">
          <label>
            {f.label}
            {f.required ? " *" : ""}
          </label>
          {f.type === "textarea" ? (
            <textarea
              className="input"
              rows={3}
              value={fields[f.key] ?? ""}
              onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          ) : (
            <input
              className="input"
              placeholder={
                f.type === "tags"
                  ? "comma, separated"
                  : f.type === "emoji"
                    ? "🎯"
                    : undefined
              }
              maxLength={f.type === "emoji" ? 8 : undefined}
              value={fields[f.key] ?? ""}
              onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          )}
        </div>
      ))}
      <div className="row gap-sm">
        <button className="btn btn-primary" type="button" disabled={!canSubmit} onClick={submit}>
          Add
        </button>
        <button className="btn" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function CollectionView({
  schema,
  collectionId,
  memberId,
}: {
  schema: RoomSchema;
  collectionId: string;
  memberId: string;
}) {
  const { isOwner, version } = useRoomSession();
  const store = useSchemaStore();
  const [adding, setAdding] = useState(false);
  void version;

  const collection = getCollection(schema, collectionId);
  if (!store || !collection) return null;

  const voteFeature = getFeatures(schema, "votes").some((f) => f.collection === collectionId);
  const statusFeature = getFeatures(schema, "status").find(
    (f): f is Extract<FeatureDef, { type: "status" }> =>
      f.type === "status" && f.collection === collectionId,
  );
  const records = voteFeature
    ? store.listRecordsSortedByVotes(collectionId)
    : store.listRecords(collectionId);

  const statusValues = statusFeature?.values ?? [];

  const canSetStatus =
    !!statusFeature &&
    (statusFeature.setBy === "member" || (statusFeature.setBy === "owner" && isOwner));

  return (
    <div className="stack">
      <div className="card-row">
        <div className="section-title" style={{ margin: 0 }}>
          {collection.label}
        </div>
        {!adding && (
          <button className="btn btn-sm btn-primary" type="button" onClick={() => setAdding(true)}>
            + Add
          </button>
        )}
      </div>

      {adding && (
        <AddRecordForm
          collection={collection}
          memberId={memberId}
          onDone={() => setAdding(false)}
        />
      )}

      {records.length === 0 && !adding && (
        <div className="empty">Nothing here yet — add the first entry.</div>
      )}

      {records.map((rec) => {
        const titleKey = titleField(collection)?.key ?? "title";
        const title = fieldValue(rec, titleKey);
        const rowEmoji = emojiField(collection)
          ? fieldValue(rec, emojiField(collection)!.key) || "📌"
          : null;
        const votes = store.getVoteCount(collectionId, rec.id);
        const voted = store.hasVoted(collectionId, rec.id, memberId);
        const bodies = bodyFields(collection);

        return (
          <div key={rec.id} className="card stack-sm idea-card">
            <div className="card-row" style={{ alignItems: "flex-start" }}>
              <div className="row gap-sm" style={{ flex: 1, minWidth: 0 }}>
                {rowEmoji && (
                  <span className="emoji-orb sm" style={{ fontSize: 20 }}>
                    {rowEmoji}
                  </span>
                )}
                <strong style={{ flex: 1 }}>{title || "Untitled"}</strong>
              </div>
              {voteFeature && (
                <button
                  type="button"
                  className={`btn btn-sm vote-btn${voted ? " voted" : ""}`}
                  onClick={() => store.toggleVote(collectionId, rec.id, memberId)}
                >
                  ▲ <span className="vote-count">{votes}</span>
                </button>
              )}
            </div>
            {bodies.map((f) => {
              const val = fieldValue(rec, f.key);
              if (!val) return null;
              if (f.type === "textarea") {
                return (
                  <p key={f.key} className="muted" style={{ fontSize: 14 }}>
                    {val}
                  </p>
                );
              }
              if (f.type === "tags") {
                return (
                  <p key={f.key} className="muted" style={{ fontSize: 13 }}>
                    {val.split(", ").map((tag) => (
                      <span key={tag} className="cadence-pill" style={{ marginRight: 4 }}>
                        {tag}
                      </span>
                    ))}
                  </p>
                );
              }
              return (
                <p key={f.key} className="muted" style={{ fontSize: 13 }}>
                  <b>{f.label}:</b> {val}
                </p>
              );
            })}
            {canSetStatus && statusValues.length > 0 && (
              <select
                className="select"
                value={rec.status ?? statusValues[0]?.id ?? ""}
                onChange={(e) =>
                  store.setRecordStatus(collectionId, rec.id, e.target.value)
                }
              >
                {statusValues.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
