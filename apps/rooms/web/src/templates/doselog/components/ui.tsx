"use client";

import type { Carer } from "../lib/types";

export function Avatar({ carer, large }: { carer: Carer; large?: boolean }) {
  const initials = carer.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: carer.color }}>
      {initials || "?"}
    </span>
  );
}
