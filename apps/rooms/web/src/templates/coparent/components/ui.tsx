"use client";

import type { Parent } from "../lib/types";

export function Avatar({ parent, large }: { parent: Parent; large?: boolean }) {
  const initials = parent.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: parent.color }}>
      {initials || "?"}
    </span>
  );
}
