"use client";

import { useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { getCollection, getFeatures } from "@/schema/validate";
import type { CollectionDef, FeatureDef, RoomSchema, SchemaRecord } from "@/schema/types";
import { useSchemaStore } from "@/schema/useSchemaStore";
import { isImageFieldEmpty } from "@/lib/imageValue";
import { EmptyState, SectionHeader } from "@/components/kit";
import { FieldInput } from "./FieldInput";
import { RecordCard } from "./RecordCard";
import { BalancePanel } from "./BalancePanel";

function fieldFilled(field: { type: string; required?: boolean }, raw: string): boolean {
  if (!field.required) return true;
  if (field.type === "image") return !isImageFieldEmpty(raw);
  return !!raw.trim();
}

function AddRecordForm({
  collection,
  memberId,
  record,
  onDone,
}: {
  collection: CollectionDef;
  memberId: string;
  record?: SchemaRecord;
  onDone: () => void;
}) {
  const store = useSchemaStore();
  const editing = !!record;
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of collection.fields) {
      const v = record?.fields[f.key];
      init[f.key] = Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : "";
    }
    return init;
  });
  const [note, setNote] = useState("");

  const submit = () => {
    if (!store) return;
    const payload: Record<string, string | string[]> = {};
    for (const f of collection.fields) {
      const raw = (fields[f.key] ?? "").trim();
      if (f.required && !raw) return;
      if (f.type === "tags" || f.type === "person-list") {
        payload[f.key] = raw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else {
        payload[f.key] = raw;
      }
    }
    if (editing && record) {
      store.updateRecord(collection.id, record.id, payload, memberId, note);
    } else {
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
    }
    onDone();
  };

  const canSubmit = collection.fields.every((f) => fieldFilled(f, fields[f.key] ?? ""));

  return (
    <div className="card stack">
      <div className="section-title">
        {editing ? "Edit" : "Add"} {collection.singular ?? collection.label}
      </div>
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
      {editing && (
        <div className="field">
          <label>Reason for change (optional)</label>
          <input
            className="input"
            value={note}
            placeholder="e.g. fixed the amount"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}
      <div className="row gap-sm">
        <button className="btn btn-primary" type="button" disabled={!canSubmit} onClick={submit}>
          {editing ? "Save changes" : "Add"}
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
  const [editing, setEditing] = useState<SchemaRecord | null>(null);
  void version;

  const collection = getCollection(schema, collectionId);
  if (!store || !collection) return null;

  const canEdit =
    !collection.permissions?.edit || collection.permissions.edit === "member" || isOwner;

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

  const currency = (schema.extensions?.currency as string) || "USD";
  const balanceFeature = getFeatures(schema, "balance").find(
    (f): f is Extract<FeatureDef, { type: "balance" }> =>
      f.type === "balance" && (f as { collection?: string }).collection === collectionId,
  );

  return (
    <div className="stack">
      <SectionHeader
        title={collection.label}
        action={
          !adding && !editing ? (
            <button className="btn btn-sm btn-primary" type="button" onClick={() => setAdding(true)}>
              + Add
            </button>
          ) : undefined
        }
      />

      {(adding || editing) && (
        <AddRecordForm
          collection={collection}
          memberId={memberId}
          record={editing ?? undefined}
          onDone={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      {records.length === 0 && !adding && (
        <EmptyState>Nothing here yet — add the first entry.</EmptyState>
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
          createdBy={store.getMember(rec.createdById)}
          members={store.listMembers()}
          currency={currency}
          onStatusChange={(s) => store.setRecordStatus(collectionId, rec.id, s, memberId)}
          onEdit={
            canEdit
              ? () => {
                  setEditing(rec);
                  setAdding(false);
                }
              : undefined
          }
          onDelete={
            canEdit
              ? () => {
                  if (window.confirm("Delete this entry? This can't be undone.")) {
                    store.removeRecord(collectionId, rec.id);
                  }
                }
              : undefined
          }
        />
      ))}

      {balanceFeature && <BalancePanel feature={balanceFeature} currency={currency} />}
    </div>
  );
}
