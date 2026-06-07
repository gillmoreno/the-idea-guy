"use client";

import type { FieldDef } from "@/schema/types";
import { EmojiPicker } from "@/components/EmojiPicker";

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
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

  return (
    <input
      className="input"
      placeholder={field.type === "tags" ? "comma, separated" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
