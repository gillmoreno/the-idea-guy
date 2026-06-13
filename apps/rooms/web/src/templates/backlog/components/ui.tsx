"use client";

import type { IdeaStatus } from "../lib/types";

const STATUS_LABEL: Record<IdeaStatus, string> = {
  proposed: "Proposed",
  building: "Building",
  shipped: "Shipped",
  parked: "Parked",
};

export function StatusPill({ status }: { status: IdeaStatus }) {
  return <span className={`status-pill status-${status}`}>{STATUS_LABEL[status]}</span>;
}
