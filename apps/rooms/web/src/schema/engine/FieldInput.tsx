"use client";

import type { FieldDef } from "@/schema/types";
import { EmojiPicker } from "@/components/EmojiPicker";
import { ImageField } from "@/components/ImageField";
import { useRoomSession } from "@/shell/RoomSessionProvider";

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
