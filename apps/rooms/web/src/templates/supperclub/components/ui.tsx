"use client";

import type { Member } from "../lib/types";

export function Avatar({ member, large }: { member: Member; large?: boolean }) {
  const initials = member.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: member.color }}>
      {initials || "?"}
    </span>
  );
}
