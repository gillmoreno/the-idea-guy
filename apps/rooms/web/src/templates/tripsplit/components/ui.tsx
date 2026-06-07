"use client";

import { formatMoney } from "@/templates/choreboard/lib/format";
import type { Traveler } from "../lib/types";

export function Money({ amount, currency }: { amount: number; currency: string }) {
  const cls = amount < 0 ? "amount-neg" : amount >= 0 ? "amount-pos" : "";
  return <span className={cls}>{formatMoney(amount, currency)}</span>;
}

export function MoneyCents({ cents, currency }: { cents: number; currency: string }) {
  return <Money amount={cents / 100} currency={currency} />;
}

export function Avatar({ traveler, large }: { traveler: Traveler; large?: boolean }) {
  const initials = traveler.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: traveler.color }}>
      {initials || "?"}
    </span>
  );
}
