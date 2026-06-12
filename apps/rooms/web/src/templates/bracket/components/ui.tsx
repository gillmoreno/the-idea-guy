"use client";

import type { Player } from "../lib/types";

export function Avatar({ player, large }: { player: Player; large?: boolean }) {
  const initials = player.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: player.color }}>
      {initials || "?"}
    </span>
  );
}
