"use client";

import type { Owner } from "../lib/types";

export function Avatar({ owner, large }: { owner: Owner; large?: boolean }) {
  const initials = owner.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: owner.color }}>
      {initials || "?"}
    </span>
  );
}
