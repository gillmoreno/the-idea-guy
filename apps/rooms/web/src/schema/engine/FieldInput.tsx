"use client";

import type { FieldDef } from "@/schema/types";
import { EmojiPicker } from "@/components/EmojiPicker";
import { ImageField } from "@/components/ImageField";
import { AddPersonByName } from "@/shell/AddPersonByName";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { useSchemaStore } from "@/schema/useSchemaStore";

const PERSON_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

/** Member picker storing the member id; people are addable inline by name. */
function PersonInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const store = useSchemaStore();
  const members = store?.listMembers() ?? [];

  return (
    <div className="stack-sm">
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— pick who —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <AddPersonByName
        placeholder="Or add someone by name"
        hint="No app needed — they claim their name if they join later."
        existingNames={members.map((m) => m.name)}
        colors={PERSON_COLORS}
        onAdd={(p) => {
          if (!store) return;
          const member = store.addMember({ name: p.name, color: p.color });
          onChange(member.id);
        }}
      />
    </div>
  );
}

/** Multi-member picker; stores a comma-joined list of member ids. */
function PersonListInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const store = useSchemaStore();
  const members = store?.listMembers() ?? [];
  const selected = value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next.join(","));
  };

  return (
    <div className="stack-sm">
      <div className="row gap-sm" style={{ flexWrap: "wrap" }}>
        {members.map((m) => (
          <button
            type="button"
            key={m.id}
            className={`btn btn-sm${selected.includes(m.id) ? " btn-primary" : ""}`}
            aria-pressed={selected.includes(m.id)}
            onClick={() => toggle(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>
      <AddPersonByName
        placeholder="Or add someone by name"
        hint="No app needed — they claim their name if they join later."
        existingNames={members.map((m) => m.name)}
        colors={PERSON_COLORS}
        onAdd={(p) => {
          if (!store) return;
          const member = store.addMember({ name: p.name, color: p.color });
          onChange([...selected, member.id].join(","));
        }}
      />
    </div>
  );
}

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const { compactRoom, roomSchema } = useRoomSession();

  if (field.type === "textarea") {
    return (
      <textarea
        className="input"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "emoji") {
    return <EmojiPicker value={value} onChange={onChange} />;
  }

  if (field.type === "person") {
    return <PersonInput value={value} onChange={onChange} />;
  }

  if (field.type === "person-list") {
    return <PersonListInput value={value} onChange={onChange} />;
  }

  if (field.type === "money") {
    const currency = (roomSchema?.extensions?.currency as string) || "USD";
    return (
      <div className="row gap-sm" style={{ alignItems: "center" }}>
        <span className="muted">{currency}</span>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <input
        className="input"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "image") {
    return (
      <ImageField
        value={value}
        onChange={onChange}
        label={field.label}
        onInlineUploaded={() => compactRoom()}
      />
    );
  }

  return (
    <input
      className="input"
      placeholder={field.type === "tags" ? "comma, separated" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
