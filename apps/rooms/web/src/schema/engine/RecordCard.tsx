"use client";

import { bodyFields, emojiField, titleField } from "@/schema/display";
import { DEFAULT_RECORD_EMOJI } from "@/lib/emoji";
import { imageValueSrc, parseImageValue } from "@/lib/imageValue";
import { formatRelativeTime } from "@/lib/relativeTime";
import { MoneyAmount, PersonChip, SplitView } from "@/components/kit";
import type { CollectionDef, FieldDef, SchemaMember, SchemaRecord } from "@/schema/types";

function fieldValue(record: SchemaRecord, key: string): string {
  const v = record.fields[key];
  if (Array.isArray(v)) return v.join(", ");
  return typeof v === "string" ? v : "";
}

/** Format a `YYYY-MM-DD` value as a friendly date; falls back to the raw string. */
function formatDateValue(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function FieldBody({
  field,
  value,
  members,
  currency,
}: {
  field: FieldDef;
  value: string;
  members?: SchemaMember[];
  currency: string;
}) {
  if (!value) return null;

  if (field.type === "person") {
    const member = members?.find((m) => m.id === value);
    return (
      <p className="schema-record__meta schema-record__person">
        <span className="schema-record__meta-label">{field.label}</span>{" "}
        <PersonChip person={member} fallback={value} />
      </p>
    );
  }

  if (field.type === "person-list") {
    const ids = value.split(", ").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return null;
    return (
      <p className="schema-record__meta schema-record__person">
        <span className="schema-record__meta-label">{field.label}</span>{" "}
        <SplitView
          members={ids.map((id) => {
            const m = members?.find((x) => x.id === id);
            return { id, person: m, fallback: id };
          })}
        />
      </p>
    );
  }

  if (field.type === "money") {
    const amount = Number.parseFloat(value);
    if (Number.isNaN(amount)) return null;
    return (
      <p className="schema-record__meta">
        <span className="schema-record__meta-label">{field.label}</span>{" "}
        <MoneyAmount amount={amount} currency={currency} />
      </p>
    );
  }

  if (field.type === "date") {
    return (
      <p className="schema-record__meta">
        <span className="schema-record__meta-label">{field.label}</span>{" "}
        {formatDateValue(value)}
      </p>
    );
  }

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
  statusBy,
  createdBy,
  members,
  currency = "USD",
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
  statusBy?: SchemaMember | null;
  createdBy?: SchemaMember | null;
  /** Room members for resolving person fields; optional (preview renders without). */
  members?: SchemaMember[];
  /** Currency for money fields; defaults to USD when not supplied (e.g. preview). */
  currency?: string;
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
        <FieldBody
          key={f.key}
          field={f}
          value={fieldValue(record, f.key)}
          members={members}
          currency={currency}
        />
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

      {!canSetStatus && status && statusValues.length > 0 && (
        <p className="schema-record__status-pill cadence-pill">
          {statusValues.find((s) => s.id === status)?.label ?? status}
        </p>
      )}

      {statusBy && status && status !== statusValues[0]?.id && (
        <p className="schema-record__status-by">
          <PersonChip person={statusBy} />
          {record.statusAt ? ` · ${formatRelativeTime(record.statusAt)}` : null}
        </p>
      )}

      {createdBy && (
        <p className="schema-record__created-by">
          Added by <PersonChip person={createdBy} /> · {formatRelativeTime(record.createdAt)}
        </p>
      )}
    </article>
  );
}
