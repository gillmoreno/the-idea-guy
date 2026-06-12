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

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const { compactRoom } = useRoomSession();

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
