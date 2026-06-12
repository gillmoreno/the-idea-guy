"use client";

import type { Driver } from "../lib/types";

export function Avatar({ driver, large }: { driver: Driver; large?: boolean }) {
  const initials = driver.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: driver.color }}>
      {initials || "?"}
    </span>
  );
}
