"use client";

import type { Saver } from "../lib/types";

export function Avatar({ saver, large }: { saver: Saver; large?: boolean }) {
  const initials = saver.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: saver.color }}>
      {initials || "?"}
    </span>
  );
}
