"use client";

import { useState } from "react";

/**
 * Solo-friendly people brick: add a named participant without an invite.
 * The person becomes room data immediately — entries can be attributed to
 * them right away — and if they join later they claim the name by tapping
 * it on the room's profile picker.
 */
export function AddPersonByName({
  placeholder = "Name",
  buttonLabel = "Add",
  hint,
  existingNames,
  colors,
  onAdd,
}: {
  placeholder?: string;
  buttonLabel?: string;
  /** Shown under the field, e.g. "No app needed — run everything from this phone." */
  hint?: string;
  existingNames: string[];
  colors: readonly string[];
  onAdd: (person: { name: string; color: string }) => void;
}) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const duplicate =
    trimmed !== "" &&
    existingNames.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase());
  const canAdd = !!trimmed && !duplicate;

  const add = () => {
    if (!canAdd) return;
    onAdd({ name: trimmed, color: colors[existingNames.length % colors.length] });
    setName("");
  };

  return (
    <div className="stack-sm">
      <div className="row gap-sm">
        <input
          className="input"
          style={{ flex: 1, minWidth: 0 }}
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn btn-primary" disabled={!canAdd} onClick={add}>
          {buttonLabel}
        </button>
      </div>
      {duplicate ? (
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Someone with that name is already in the room.
        </p>
      ) : (
        hint && (
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
