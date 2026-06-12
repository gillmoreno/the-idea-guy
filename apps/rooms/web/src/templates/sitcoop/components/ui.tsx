"use client";

import type { Family } from "../lib/types";

export function Avatar({ family, large }: { family: Family; large?: boolean }) {
  const initials = family.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: family.color }}>
      {initials || "?"}
    </span>
  );
}
