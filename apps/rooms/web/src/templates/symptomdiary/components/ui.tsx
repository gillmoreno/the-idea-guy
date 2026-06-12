"use client";

import type { Observer } from "../lib/types";

export function Avatar({ observer, large }: { observer: Observer; large?: boolean }) {
  const initials = observer.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: observer.color }}>
      {initials || "?"}
    </span>
  );
}
