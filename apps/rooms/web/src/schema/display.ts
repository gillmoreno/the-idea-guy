import type { CollectionDef, FieldDef } from "./types";

/** First required text field, else field keyed `title`, else first text field. */
export function titleField(collection: CollectionDef): FieldDef | undefined {
  return (
    collection.fields.find((f) => f.key === "title" && f.type === "text") ??
    collection.fields.find((f) => f.required && f.type === "text") ??
    collection.fields.find((f) => f.type === "text")
  );
}

export function emojiField(collection: CollectionDef): FieldDef | undefined {
  return collection.fields.find((f) => f.type === "emoji");
}

/** Fields shown below title row (not title, not emoji). */
export function bodyFields(collection: CollectionDef): FieldDef[] {
  const t = titleField(collection)?.key;
  const e = emojiField(collection)?.key;
  return collection.fields.filter((f) => f.key !== t && f.key !== e);
}
