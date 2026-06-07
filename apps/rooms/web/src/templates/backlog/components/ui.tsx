"use client";

import type { IdeaStatus, Member } from "../lib/types";

const STATUS_LABEL: Record<IdeaStatus, string> = {
  proposed: "Proposed",
  building: "Building",
  shipped: "Shipped",
  parked: "Parked",
};

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

export function StatusPill({ status }: { status: IdeaStatus }) {
  return <span className={`status-pill status-${status}`}>{STATUS_LABEL[status]}</span>;
}
