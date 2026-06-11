"use client";

import { useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { getCollection, getFeatures } from "@/schema/validate";
import type { CollectionDef, FeatureDef, RoomSchema } from "@/schema/types";
import { useSchemaStore } from "@/schema/useSchemaStore";
import { isImageFieldEmpty } from "@/lib/imageValue";
import { FieldInput } from "./FieldInput";
import { RecordCard } from "./RecordCard";

function fieldFilled(field: { type: string; required?: boolean }, raw: string): boolean {
  if (!field.required) return true;
  if (field.type === "image") return !isImageFieldEmpty(raw);
  return !!raw.trim();
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

  const canSubmit = collection.fields.every((f) => fieldFilled(f, fields[f.key] ?? ""));

  return (
    <div className="card stack">
      <div className="section-title">Add {collection.singular ?? collection.label}</div>
      {collection.fields.map((f) => (
        <div key={f.key} className="field">
          <label>
            {f.label}
            {f.required ? " *" : ""}
          </label>
          <FieldInput
            field={f}
            value={fields[f.key] ?? ""}
            onChange={(v) => setFields((prev) => ({ ...prev, [f.key]: v }))}
          />
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

      {records.map((rec) => (
        <RecordCard
          key={rec.id}
          record={rec}
          collection={collection}
          voteFeature={voteFeature}
          votes={store.getVoteCount(collectionId, rec.id)}
          voted={store.hasVoted(collectionId, rec.id, memberId)}
          onToggleVote={() => store.toggleVote(collectionId, rec.id, memberId)}
          canSetStatus={canSetStatus}
          statusValues={statusValues}
          status={rec.status}
          statusBy={rec.statusById ? store.getMember(rec.statusById) : null}
          onStatusChange={(s) => store.setRecordStatus(collectionId, rec.id, s, memberId)}
        />
      ))}
    </div>
  );
}
