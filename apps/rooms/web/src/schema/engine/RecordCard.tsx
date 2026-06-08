"use client";

import { bodyFields, emojiField, titleField } from "@/schema/display";
import { DEFAULT_RECORD_EMOJI } from "@/lib/emoji";
import { imageValueSrc, parseImageValue } from "@/lib/imageValue";
import type { CollectionDef, FieldDef, SchemaRecord } from "@/schema/types";

function fieldValue(record: SchemaRecord, key: string): string {
  const v = record.fields[key];
  if (Array.isArray(v)) return v.join(", ");
  return typeof v === "string" ? v : "";
}

function FieldBody({ field, value }: { field: FieldDef; value: string }) {
  if (!value) return null;

  if (field.type === "textarea") {
    return <p className="schema-record__body schema-record__pitch">{value}</p>;
  }

  if (field.type === "tags") {
    const tags = value.split(", ").filter(Boolean);
    return (
      <div className="schema-record__tags">
        {tags.map((tag) => (
          <span key={tag} className="cadence-pill">
            {tag}
          </span>
        ))}
      </div>
    );
  }

  if (field.type === "text") {
    return (
      <p className="schema-record__meta">
        <span className="schema-record__meta-label">{field.label}</span> {value}
      </p>
    );
  }

  if (field.type === "image") {
    const src = imageValueSrc(parseImageValue(value));
    if (!src) return null;
    return (
      <figure className="schema-record__image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={field.label} loading="lazy" />
      </figure>
    );
  }

  return (
    <p className="schema-record__meta">
      <span className="schema-record__meta-label">{field.label}</span> {value}
    </p>
  );
}

export function RecordCard({
  record,
  collection,
  voteFeature,
  votes,
  voted,
  onToggleVote,
  canSetStatus,
  statusValues,
  status,
  onStatusChange,
}: {
  record: SchemaRecord;
  collection: CollectionDef;
  voteFeature: boolean;
  votes: number;
  voted: boolean;
  onToggleVote: () => void;
  canSetStatus: boolean;
  statusValues: { id: string; label: string }[];
  status?: string;
  onStatusChange: (status: string) => void;
}) {
  const titleKey = titleField(collection)?.key ?? "title";
  const title = fieldValue(record, titleKey) || "Untitled";
  const emojiDef = emojiField(collection);
  const rowEmoji = emojiDef
    ? fieldValue(record, emojiDef.key) || DEFAULT_RECORD_EMOJI
    : null;
  const bodies = bodyFields(collection);

  return (
    <article className="card schema-record" data-testid="schema-record">
      <header className="schema-record__header">
        <div className="schema-record__head">
          {rowEmoji && (
            <span className="schema-record__emoji" aria-hidden>
              {rowEmoji}
            </span>
          )}
          <h3 className="schema-record__title">{title}</h3>
        </div>
        {voteFeature && (
          <button
            type="button"
            className={`btn btn-sm vote-btn schema-record__vote${voted ? " voted" : ""}`}
            onClick={onToggleVote}
            aria-pressed={voted}
          >
            ▲ <span className="vote-count">{votes}</span>
          </button>
        )}
      </header>

      {bodies.map((f) => (
        <FieldBody key={f.key} field={f} value={fieldValue(record, f.key)} />
      ))}

      {canSetStatus && statusValues.length > 0 && (
        <label className="schema-record__status-field">
          <span className="sr-only">Status</span>
          <select
            className="select schema-record__status"
            value={status ?? statusValues[0]?.id ?? ""}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {statusValues.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </article>
  );
}
